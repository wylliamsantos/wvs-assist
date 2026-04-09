#!/usr/bin/env bun
import blessed from 'neo-blessed';

type Mode = 'guided' | 'expert';
type ScreenMode = 'home' | 'guided' | 'expert';
type SessionStatus = 'backlog' | 'drafted' | 'ready' | 'in-progress' | 'review' | 'done' | 'error';

type SessionRecord = {
  id: string;
  agentId: string;
  agentName: string;
  workflow: string;
  phase: string;
  runMode: Mode;
  status: SessionStatus;
  importedFrom?: string[];
  startedAt: string;
  updatedAt: string;
};

type WorkflowSummary = {
  id: string;
  persona: string;
  personaName: string;
  phase: string;
  summary: string;
};

type ExpertCard = {
  persona: string;
  personaName: string;
  phase: string;
  workflowId: string;
  summary: string;
};

type PendingQuestion = {
  questionId: string;
  prompt: string;
  sessionId: string;
};

const API_BASE = process.env.BMAD_API_URL || 'http://127.0.0.1:4000';
const ACCESS_TOKEN = process.env.BMAD_ACCESS_TOKEN || 'demo-access-token';

const GUIDED_FLOW = [
  { phase: 'analysis', persona: 'Mary — Business Analyst', workflowId: 'analysis.problem-tree', label: 'Descoberta da Ideia' },
  { phase: 'planning', persona: 'John — Product Manager', workflowId: 'planning.create-prd', label: 'Planejamento do Produto' },
  { phase: 'solutioning', persona: 'Winston — System Architect', workflowId: 'solutioning.create-architecture', label: 'Arquitetura Técnica' },
  { phase: 'implementation', persona: 'Amelia — Developer', workflowId: 'implementation.develop-story', label: 'Execução Inicial' },
  { phase: 'testing', persona: 'Murat — Master Test Architect', workflowId: 'testing.quality-gate-report', label: 'Quality Gate' },
  { phase: 'documentation', persona: 'Paige — Technical Writer', workflowId: 'documentation.changelog-journal', label: 'Documentação Final' },
] as const;

const screen = blessed.screen({ smartCSR: true, title: 'BMAD Orchestrator', fullUnicode: true });

const header = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  tags: true,
  style: { bg: 'magenta', fg: 'black' },
});

const leftPanel = blessed.box({
  parent: screen,
  top: 3,
  left: 0,
  width: '34%',
  height: '68%-3',
  label: ' Jornada ',
  border: { type: 'line' },
  style: { border: { fg: 'cyan' } },
  tags: true,
  scrollable: true,
});

const centerPanel = blessed.box({
  parent: screen,
  top: 3,
  left: '34%',
  width: '36%',
  height: '68%-3',
  label: ' Seleção ',
  border: { type: 'line' },
  style: { border: { fg: 'yellow' } },
  tags: true,
  scrollable: true,
});

const rightPanel = blessed.box({
  parent: screen,
  top: 3,
  left: '70%',
  width: '30%',
  height: '68%-3',
  label: ' Detalhes ',
  border: { type: 'line' },
  style: { border: { fg: 'white' } },
  tags: true,
  scrollable: true,
});

const logs = blessed.log({
  parent: screen,
  top: '68%',
  left: 0,
  width: '100%',
  height: '32%',
  label: ' Activity Log ',
  border: { type: 'line' },
  style: { border: { fg: 'green' } },
  tags: true,
  scrollback: 500,
});

const questionBox = blessed.box({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '80%',
  height: 9,
  label: ' Pergunta do Agente ',
  border: { type: 'line' },
  style: { border: { fg: 'magenta' }, bg: 'black' },
  hidden: true,
  tags: true,
});

const questionPrompt = blessed.box({
  parent: questionBox,
  top: 1,
  left: 1,
  width: '95%',
  height: 3,
  tags: true,
  content: '',
});

const questionInput = blessed.textbox({
  parent: questionBox,
  top: 4,
  left: 1,
  width: '95%',
  height: 3,
  border: { type: 'line' },
  inputOnFocus: true,
  keys: true,
  mouse: true,
  style: { border: { fg: 'cyan' } },
});

let ws: WebSocket | null = null;
let workflows: WorkflowSummary[] = [];
let sessions: SessionRecord[] = [];
let expertCards: ExpertCard[] = [];

let screenMode: ScreenMode = 'home';
let homeSelected = 0;
let expertSelected = 0;
let isProcessing = false;
let processingLabel = '';
let pendingQuestion: PendingQuestion | null = null;

function log(msg: string) {
  logs.log(`[${new Date().toISOString()}] ${msg}`);
}

function renderHeader() {
  const screenLabel = screenMode === 'home' ? 'HOME' : screenMode === 'guided' ? 'GUIDED' : 'EXPERT';
  const tips = screenMode === 'home'
    ? '[↑/↓] escolher [enter] entrar [q] sair'
    : '[↑/↓] navegar [enter] executar [r] refresh [h] home [q] sair';
  const processing = isProcessing ? ` | PROCESSANDO: ${processingLabel}` : '';
  header.setContent(` BMAD Orchestrator | ${screenLabel} | ${tips}${processing}`);
}

function getGuidedProgress() {
  let done = 0;
  for (const step of GUIDED_FLOW) {
    const completed = sessions.some((s) => s.runMode === 'guided' && s.phase === step.phase && s.status === 'done');
    if (completed) done++;
  }
  return { done, total: GUIDED_FLOW.length };
}

function progressBar(done: number, total: number, width = 18) {
  const ratio = total === 0 ? 0 : done / total;
  const fill = Math.round(ratio * width);
  return `[${'█'.repeat(fill)}${'░'.repeat(Math.max(0, width - fill))}] ${Math.round(ratio * 100)}%`;
}

function nextGuidedStep() {
  for (const step of GUIDED_FLOW) {
    const completed = sessions.some((s) => s.runMode === 'guided' && s.phase === step.phase && s.status === 'done');
    if (!completed) return step;
  }
  return null;
}

function renderHome() {
  leftPanel.setLabel(' Jornada BMAD ');
  centerPanel.setLabel(' Escolha o Modo da Sessão ');
  rightPanel.setLabel(' O que vai acontecer ');

  const options = ['Jornada Guiada (do zero)', 'Consulta Especialista (pontual)'];
  centerPanel.setContent(
    options
      .map((opt, i) => `${homeSelected === i ? '{magenta-fg}➤{/magenta-fg}' : ' '} ${opt}`)
      .join('\n\n')
  );

  leftPanel.setContent([
    '{bold}Fluxo esperado:{/bold}',
    '',
    ...GUIDED_FLOW.map((s, idx) => `${idx + 1}. ${s.label}`),
    '',
    '{gray-fg}No Guided, você não escolhe workflow técnico.{/gray-fg}',
  ].join('\n'));

  rightPanel.setContent(
    homeSelected === 0
      ? [
          '{bold}Guided{/bold}',
          '',
          'Inicia automaticamente com Mary (Business Analyst).',
          'Perguntas de descoberta da ideia.',
          'Handoff entre fases até entrega final.',
        ].join('\n')
      : [
          '{bold}Expert{/bold}',
          '',
          'Você escolhe um especialista por card.',
          'Recebe opinião técnica pontual.',
          'Pode importar para jornada guided depois.',
        ].join('\n')
  );
}

function renderGuided() {
  leftPanel.setLabel(' Guided Journey ');
  centerPanel.setLabel(' Próxima Etapa ');
  rightPanel.setLabel(' Detalhes da Etapa ');

  const progress = getGuidedProgress();
  const step = nextGuidedStep();

  leftPanel.setContent([
    `{bold}Progresso{/bold}: ${progressBar(progress.done, progress.total)}`,
    '',
    ...GUIDED_FLOW.map((s) => {
      const done = sessions.some((x) => x.runMode === 'guided' && x.phase === s.phase && x.status === 'done');
      const running = sessions.some((x) => x.runMode === 'guided' && x.phase === s.phase && x.status === 'in-progress');
      const marker = done ? '{green-fg}✔{/green-fg}' : running ? '{yellow-fg}●{/yellow-fg}' : '{gray-fg}○{/gray-fg}';
      return `${marker} ${s.label}`;
    }),
  ].join('\n'));

  if (!step) {
    centerPanel.setContent('{green-fg}Jornada concluída.{/green-fg}\n\nTodos os passos guided foram finalizados.');
    rightPanel.setContent('Você pode iniciar nova sessão guided na Home (h).');
    return;
  }

  centerPanel.setContent([
    `{bold}${step.label}{/bold}`,
    '',
    `Especialista: ${step.persona}`,
    '',
    isProcessing
      ? '{yellow-fg}Agente processando... aguarde{/yellow-fg}'
      : '{cyan-fg}Pressione Enter para iniciar esta etapa{/cyan-fg}',
  ].join('\n'));

  rightPanel.setContent([
    '{bold}Como funciona{/bold}',
    '',
    '1) Inicia a etapa atual',
    '2) Responde perguntas do agente (popup)',
    '3) Finaliza e libera próxima etapa',
    '',
    '{gray-fg}Workflows técnicos ficam ocultos no Guided.{/gray-fg}',
  ].join('\n'));
}

function renderExpert() {
  leftPanel.setLabel(' Expert Specialists ');
  centerPanel.setLabel(' Cards de Especialistas ');
  rightPanel.setLabel(' Detalhes ');

  if (expertCards.length === 0) {
    centerPanel.setContent('{gray-fg}Sem especialistas disponíveis.{/gray-fg}');
    return;
  }

  leftPanel.setContent([
    '{bold}Modo Expert{/bold}',
    '',
    'Escolha um especialista com setas.',
    'Pressione Enter para rodar.',
    isProcessing ? '{yellow-fg}Processando... navegação bloqueada{/yellow-fg}' : '{green-fg}Pronto{/green-fg}',
  ].join('\n'));

  centerPanel.setContent(
    expertCards
      .map((c, i) => {
        const on = i === expertSelected;
        return [
          `${on ? '{magenta-fg}┏━{/magenta-fg}' : '{gray-fg}┌─{/gray-fg}'} ${c.personaName}`,
          `   {gray-fg}${c.phase}{/gray-fg}`,
          `${on ? '{magenta-fg}┗━{/magenta-fg}' : '{gray-fg}└─{/gray-fg}'} ${c.summary.slice(0, 58)}`,
        ].join('\n');
      })
      .join('\n\n')
  );

  const sel = expertCards[expertSelected];
  rightPanel.setContent(
    sel
      ? [
          `{bold}${sel.personaName}{/bold}`,
          '',
          `Fase: ${sel.phase}`,
          '',
          'Esse especialista vai te ajudar nessa parte do projeto.',
          '',
          isProcessing ? '{yellow-fg}Aguarde finalizar execução atual{/yellow-fg}' : '{cyan-fg}Pressione Enter para executar{/cyan-fg}',
        ].join('\n')
      : 'Sem card selecionado'
  );
}

function renderAll() {
  renderHeader();
  if (screenMode === 'home') renderHome();
  if (screenMode === 'guided') renderGuided();
  if (screenMode === 'expert') renderExpert();
  screen.render();
}

function connectMcp() {
  ws = new WebSocket(`${API_BASE.replace('http', 'ws')}/mcp?access_token=${ACCESS_TOKEN}`);
  ws.onopen = () => {
    log('MCP conectado');
    renderAll();
  };
  ws.onclose = () => log('MCP desconectado');
  ws.onerror = () => log('MCP erro de conexão');

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(String(ev.data));
      if (msg.type === 'workflow.run.started') {
        isProcessing = true;
        processingLabel = msg.workflowId ?? 'workflow';
        log(`Run started: ${msg.workflowId}`);
      }
      if (msg.type === 'workflow.question') {
        pendingQuestion = {
          questionId: msg.questionId,
          prompt: msg.prompt ?? 'Responda para continuar',
          sessionId: msg.sessionId,
        };
        questionPrompt.setContent(pendingQuestion.prompt);
        questionInput.setValue('');
        questionBox.show();
        questionInput.focus();
        screen.render();
      }
      if (msg.type === 'workflow.run.error') {
        isProcessing = false;
        processingLabel = '';
        log(`Run error: ${msg.error}`);
      }
      if (msg.type === 'workflow.run.completed') {
        isProcessing = false;
        processingLabel = '';
        log(`Run completed: ${msg.workflowId}`);
        void refreshData();
      }
    } catch {
      // ignore non-json
    }
    renderAll();
  };
}

async function refreshData() {
  try {
    const [wRes, sRes] = await Promise.all([fetch(`${API_BASE}/workflows`), fetch(`${API_BASE}/sessions`)]);
    const wData = (await wRes.json()) as { workflows: WorkflowSummary[] };
    const sData = (await sRes.json()) as { sessions: SessionRecord[] };

    workflows = wData.workflows ?? [];
    sessions = (sData.sessions ?? []).map((s) => ({
      ...s,
      runMode: s.runMode ?? 'guided',
      phase: s.phase ?? s.workflow.split('.')[0],
      importedFrom: s.importedFrom ?? [],
    }));

    const byPersona = new Map<string, ExpertCard>();
    for (const w of workflows) {
      if (!byPersona.has(w.persona)) {
        byPersona.set(w.persona, {
          persona: w.persona,
          personaName: w.personaName,
          phase: w.phase,
          workflowId: w.id,
          summary: w.summary,
        });
      }
    }
    expertCards = Array.from(byPersona.values());
    if (expertSelected >= expertCards.length) expertSelected = Math.max(0, expertCards.length - 1);

    log(`Refresh ok: ${workflows.length} workflows / ${sessions.length} sessions`);
  } catch (err) {
    log(`Refresh error: ${String(err)}`);
  }
  renderAll();
}

function sendRun(workflowId: string, mode: Mode) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    log('MCP offline');
    return;
  }
  if (isProcessing) {
    log('Aguarde: já existe processamento em andamento.');
    return;
  }

  const runId = `run-${Date.now()}`;
  const sessionId = `ses-${Date.now()}`;
  ws.send(
    JSON.stringify({
      id: runId,
      type: 'workflow.run',
      workflowId,
      sessionId,
      runMode: mode,
      input: mode === 'guided' ? 'Sessão guiada iniciada.' : 'Consulta especialista iniciada.',
    })
  );
  isProcessing = true;
  processingLabel = workflowId;
  log(`Run enviado: ${workflowId} [${mode}]`);
  renderAll();
}

function runGuidedCurrentStep() {
  const step = nextGuidedStep();
  if (!step) {
    log('Jornada guided já concluída.');
    return;
  }
  sendRun(step.workflowId, 'guided');
}

function runExpertSelected() {
  const sel = expertCards[expertSelected];
  if (!sel) return;
  sendRun(sel.workflowId, 'expert');
}

questionInput.on('submit', (value) => {
  if (!pendingQuestion || !ws || ws.readyState !== WebSocket.OPEN) {
    questionBox.hide();
    screen.render();
    return;
  }
  const answer = String(value ?? '').trim();
  if (!answer) return;
  ws.send(JSON.stringify({ type: 'workflow.answer', questionId: pendingQuestion.questionId, answer }));
  log(`Resposta enviada para ${pendingQuestion.questionId}`);
  pendingQuestion = null;
  questionBox.hide();
  screen.render();
});

questionInput.key('escape', () => {
  questionBox.hide();
  screen.render();
});

screen.key(['q', 'C-c'], () => process.exit(0));
screen.key(['r'], () => void refreshData());
screen.key(['h'], () => {
  if (isProcessing) return log('Aguarde finalizar processamento atual.');
  screenMode = 'home';
  renderAll();
});

screen.key(['up', 'k'], () => {
  if (isProcessing || questionBox.visible) return;
  if (screenMode === 'home') {
    homeSelected = homeSelected <= 0 ? 1 : homeSelected - 1;
  } else if (screenMode === 'expert' && expertCards.length > 0) {
    expertSelected = expertSelected <= 0 ? expertCards.length - 1 : expertSelected - 1;
  }
  renderAll();
});

screen.key(['down', 'j'], () => {
  if (isProcessing || questionBox.visible) return;
  if (screenMode === 'home') {
    homeSelected = (homeSelected + 1) % 2;
  } else if (screenMode === 'expert' && expertCards.length > 0) {
    expertSelected = (expertSelected + 1) % expertCards.length;
  }
  renderAll();
});

screen.key(['enter'], () => {
  if (questionBox.visible) return;
  if (screenMode === 'home') {
    screenMode = homeSelected === 0 ? 'guided' : 'expert';
    renderAll();
    return;
  }
  if (screenMode === 'guided') return runGuidedCurrentStep();
  if (screenMode === 'expert') return runExpertSelected();
});

renderAll();
connectMcp();
await refreshData();
log('UI pronta');
renderAll();
