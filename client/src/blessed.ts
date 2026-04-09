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

const screen = blessed.screen({ smartCSR: true, title: 'WVS Orbit', fullUnicode: true });

const header = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  tags: true,
  style: { bg: 'blue', fg: 'white' },
});

const leftPanel = blessed.box({
  parent: screen,
  top: 3,
  left: 0,
  width: '100%',
  height: 6,
  label: ' Jornada ',
  border: { type: 'line' },
  style: { border: { fg: 'cyan' } },
  tags: true,
});

const centerPanel = blessed.box({
  parent: screen,
  top: 9,
  left: 0,
  width: '100%',
  height: '100%-15',
  label: ' Workspace ',
  border: { type: 'line' },
  style: { border: { fg: 'yellow' } },
  tags: true,
  scrollable: true,
  alwaysScroll: true,
});

const logs = blessed.log({
  parent: screen,
  top: '100%-6',
  left: 0,
  width: '100%',
  height: 6,
  label: ' System Log ',
  border: { type: 'line' },
  style: { border: { fg: 'gray' } },
  tags: true,
  scrollback: 120,
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
let guidedNarrative = 'Escolha Jornada Guiada para começar com a Mary no discovery.';
let activeRunMode: Mode | null = null;
let activeRunWorkflowId: string | null = null;
let conversationLines: string[] = ['⚙️ WVS Orbit pronto para iniciar.'];

function log(msg: string) {
  logs.log(`[${new Date().toISOString()}] ${msg}`);
}

function addConversation(line: string) {
  conversationLines.push(line);
  if (conversationLines.length > 80) conversationLines = conversationLines.slice(-80);
}

function firstNameFromPersona(personaLabel: string) {
  return personaLabel.split('—')[0]?.trim() || personaLabel;
}

function emojiForPersona(personaLabel: string) {
  const first = firstNameFromPersona(personaLabel).toLowerCase();
  const female = new Set(['mary', 'sally', 'amelia', 'paige']);
  return female.has(first) ? '👩' : '👨';
}

function agentLine(personaLabel: string, text: string) {
  return `${emojiForPersona(personaLabel)} ${firstNameFromPersona(personaLabel)}: ${text}`;
}

function userLine(text: string) {
  return `🧑 Você: ${text}`;
}

function systemLine(text: string) {
  return `⚙️ ${text}`;
}

function formattedConversation(limit: number) {
  const lines = conversationLines.slice(-limit);
  const out: string[] = [];
  lines.forEach((line, idx) => {
    if (idx > 0) out.push('');
    out.push(`• ${line}`);
  });
  return out;
}

function renderHeader() {
  const screenLabel = screenMode === 'home' ? 'HOME' : screenMode === 'guided' ? 'GUIDED' : 'EXPERT';
  const tips = screenMode === 'home'
    ? '[↑/↓] escolher [enter] entrar [q] sair'
    : '[↑/↓] navegar [enter] executar [r] refresh [h] home [q] sair';
  const processing = isProcessing ? ` | PROCESSANDO: ${processingLabel}` : '';
  header.align = 'center';
  header.setContent(`WVS Orbit — Powered by WVS Systems | ${screenLabel} | ${tips}${processing}`);
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

function stepByWorkflowId(workflowId: string) {
  return GUIDED_FLOW.find((s) => s.workflowId === workflowId) ?? null;
}

function nextStepAfterWorkflow(workflowId: string) {
  const idx = GUIDED_FLOW.findIndex((s) => s.workflowId === workflowId);
  if (idx < 0 || idx + 1 >= GUIDED_FLOW.length) return null;
  return GUIDED_FLOW[idx + 1];
}

function setGuidedIntro(step = GUIDED_FLOW[0]) {
  guidedNarrative = `Olá! Eu sou ${step.persona}. Vou te guiar na etapa \"${step.label}\" e transformar sua ideia em decisões claras.`;
}

function setGuidedHandoff(completedWorkflowId: string) {
  const current = stepByWorkflowId(completedWorkflowId);
  const next = nextStepAfterWorkflow(completedWorkflowId);
  if (!current) return;
  if (!next) {
    guidedNarrative = 'Jornada concluída com sucesso.';
    addConversation(agentLine(current.persona, `finalizei ${current.label}. Encerramos a jornada por aqui.`));
    return;
  }
  guidedNarrative = `${firstNameFromPersona(current.persona)} passou o contexto para ${firstNameFromPersona(next.persona)}.`;
  addConversation(agentLine(current.persona, `concluí ${current.label}. Vou passar para ${firstNameFromPersona(next.persona)}.`));
  addConversation(agentLine(next.persona, `recebi o contexto e vou assumir ${next.label}.`));
}

function renderHome() {
  leftPanel.setLabel(' Jornada BMAD ');
  centerPanel.setLabel(' Sessão Inicial ');

  const options = ['Jornada Guiada (do zero)', 'Consulta Especialista (pontual)'];

  leftPanel.setContent([
    '{bold}Fases:{/bold} Descoberta → Planejamento → Arquitetura → Execução → QA → Documentação',
    '{gray-fg}A jornada guided escolhe o próximo passo automaticamente.{/gray-fg}',
  ].join('\n'));

  centerPanel.setContent([
    '{bold}Como quer começar esta sessão?{/bold}',
    '',
    ...options.map((opt, i) => `${homeSelected === i ? '{magenta-fg}➤{/magenta-fg}' : ' '} ${opt}`),
    '',
    homeSelected === 0
      ? 'Guided: começa com Mary no discovery e segue com handoff humano entre especialistas.'
      : 'Expert: selecione um especialista por card para uma análise pontual.',
    '',
    '{bold}Conversa{/bold}',
    ...formattedConversation(8),
  ].join('\n'));
}
function renderGuided() {
  leftPanel.setLabel(' Guided Journey ');
  centerPanel.setLabel(' Etapa Atual ');

  const progress = getGuidedProgress();
  const step = nextGuidedStep();

  leftPanel.setContent([
    `{bold}Progresso:{/bold} ${progressBar(progress.done, progress.total, 24)}`,
    GUIDED_FLOW.map((s) => {
      const done = sessions.some((x) => x.runMode === 'guided' && x.phase === s.phase && x.status === 'done');
      const running = sessions.some((x) => x.runMode === 'guided' && x.phase === s.phase && x.status === 'in-progress');
      const marker = done ? '{green-fg}✔{/green-fg}' : running ? '{yellow-fg}●{/yellow-fg}' : '{gray-fg}○{/gray-fg}';
      return `${marker} ${s.label}`;
    }).join('   '),
  ].join('\n'));

  if (!step) {
    centerPanel.setContent([
      '{green-fg}Jornada concluída.{/green-fg}',
      '',
      ...formattedConversation(12),
    ].join('\n'));
    return;
  }

  centerPanel.setContent([
    `${emojiForPersona(step.persona)} ${firstNameFromPersona(step.persona)} • ${step.label}`,
    isProcessing
      ? '{yellow-fg}Agente processando... aguarde{/yellow-fg}'
      : '{cyan-fg}Pressione Enter para iniciar esta etapa{/cyan-fg}',
    '',
    guidedNarrative,
    '',
    ...formattedConversation(12),
  ].join('\n'));
}
function renderExpert() {
  leftPanel.setLabel(' Expert Journey ');
  centerPanel.setLabel(' Especialistas ');

  if (expertCards.length === 0) {
    centerPanel.setContent('{gray-fg}Sem especialistas disponíveis.{/gray-fg}');
    return;
  }

  leftPanel.setContent([
    '{bold}Expert{/bold}: escolha o especialista por card',
    isProcessing ? '{yellow-fg}Processando... aguarde{/yellow-fg}' : '{green-fg}Pronto para nova consulta{/green-fg}',
  ].join('\n'));

  const sel = expertCards[expertSelected];
  centerPanel.setContent([
    ...expertCards.map((c, i) => {
      const on = i === expertSelected;
      return `${on ? '{magenta-fg}➤{/magenta-fg}' : ' '} ${c.personaName} {gray-fg}(${c.phase}){/gray-fg}`;
    }),
    '',
    sel ? `${emojiForPersona(sel.personaName)} ${firstNameFromPersona(sel.personaName)} selecionado` : 'Sem card selecionado',
    sel ? sel.summary : '',
    '',
    ...formattedConversation(10),
  ].join('\n'));
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
        if (msg.runMode === 'guided') {
          const step = stepByWorkflowId(msg.workflowId ?? '');
          if (step) {
            guidedNarrative = `Oi! Eu sou ${step.persona}. Vou conduzir você em \"${step.label}\". Vamos nessa.`;
          }
        }
        if (msg.runMode === 'expert') {
          const card = expertCards.find((c) => c.workflowId === msg.workflowId);
          if (card) {
            addConversation(agentLine(card.personaName, 'Oi, vou assumir essa análise e te retorno com recomendação objetiva.'));
          }
        }
        addConversation(systemLine(`Execução iniciada: ${msg.workflowId}`));
        log(`Run started: ${msg.workflowId}`);
      }
      if (msg.type === 'workflow.question') {
        pendingQuestion = {
          questionId: msg.questionId,
          prompt: msg.prompt ?? 'Responda para continuar',
          sessionId: msg.sessionId,
        };
        const ownerStep = activeRunWorkflowId ? stepByWorkflowId(activeRunWorkflowId) : null;
        const kind = msg.questionKind ?? 'unknown';
        const reason = msg.questionReason ? ` | motivo: ${msg.questionReason}` : '';
        log(`[PERGUNTA][${String(kind).toUpperCase()}] ${pendingQuestion.prompt}${reason}`);

        questionBox.setLabel(` Pergunta ${ownerStep ? `${emojiForPersona(ownerStep.persona)} ${firstNameFromPersona(ownerStep.persona)}` : 'do Agente'} `);
        if (ownerStep) addConversation(agentLine(ownerStep.persona, pendingQuestion.prompt));
        questionPrompt.setContent(pendingQuestion.prompt);
        questionInput.setValue('');
        renderAll();
        questionBox.show();
        questionBox.setFront();
        questionInput.focus();
        screen.render();
      }
      if (msg.type === 'workflow.run.error') {
        isProcessing = false;
        processingLabel = '';
        activeRunMode = null;
        activeRunWorkflowId = null;
        addConversation(systemLine(`Falha na execução: ${msg.error}`));
        log(`Run error: ${msg.error}`);
      }
      if (msg.type === 'workflow.run.completed') {
        isProcessing = false;
        processingLabel = '';
        if (activeRunMode === 'guided' && activeRunWorkflowId) {
          setGuidedHandoff(activeRunWorkflowId);
        }
        addConversation(systemLine(`Execução concluída: ${msg.workflowId}`));
        activeRunMode = null;
        activeRunWorkflowId = null;
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
  activeRunMode = mode;
  activeRunWorkflowId = workflowId;
  if (mode === 'guided') {
    const step = stepByWorkflowId(workflowId);
    if (step) {
      guidedNarrative = `Oi! Eu sou ${step.persona}. Vou te guiar nesta etapa: \"${step.label}\".`;
      addConversation(agentLine(step.persona, `vamos iniciar ${step.label}.`));
    }
  } else {
    const card = expertCards.find((c) => c.workflowId === workflowId);
    if (card) addConversation(systemLine(`Solicitação enviada para ${firstNameFromPersona(card.personaName)}.`));
  }
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
    renderAll();
    return;
  }
  const answer = String(value ?? '').trim();
  if (!answer) return;
  ws.send(JSON.stringify({ type: 'workflow.answer', questionId: pendingQuestion.questionId, answer }));
  addConversation(userLine(answer));
  log(`Resposta enviada para ${pendingQuestion.questionId}`);
  pendingQuestion = null;
  questionBox.hide();
  renderAll();
});

questionInput.key('escape', () => {
  questionBox.hide();
  renderAll();
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
    if (screenMode === 'guided') {
      setGuidedIntro();
      addConversation(agentLine('Mary — Business Analyst', 'Oi, eu vou começar com você pelo discovery da ideia.'));
    }
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
