#!/usr/bin/env bun
import blessed from 'neo-blessed';

type Mode = 'guided' | 'expert';
type ScreenMode = 'home' | 'guided' | 'expert';
type SessionStatus = 'backlog' | 'drafted' | 'ready' | 'in-progress' | 'review' | 'done' | 'error';

type SessionRecord = { id: string; workflow: string; phase: string; runMode: Mode; status: SessionStatus };
type WorkflowSummary = { id: string; persona: string; personaName: string; phase: string; summary: string };
type ExpertCard = { personaName: string; phase: string; workflowId: string; summary: string };

const API_BASE = process.env.BMAD_API_URL || 'http://127.0.0.1:4000';
const ACCESS_TOKEN = process.env.BMAD_ACCESS_TOKEN || 'demo-access-token';
const USE_EMOJI = process.env.WVS_EMOJI === '1';

const GUIDED_FLOW = [
  { phase: 'analysis', persona: 'Mary — Business Analyst', workflowId: 'analysis.problem-tree', label: 'Descoberta da Ideia' },
  { phase: 'planning', persona: 'John — Product Manager', workflowId: 'planning.create-prd', label: 'Planejamento do Produto' },
  { phase: 'solutioning', persona: 'Winston — System Architect', workflowId: 'solutioning.create-architecture', label: 'Arquitetura Técnica' },
  { phase: 'implementation', persona: 'Amelia — Developer', workflowId: 'implementation.develop-story', label: 'Execução Inicial' },
  { phase: 'testing', persona: 'Murat — Master Test Architect', workflowId: 'testing.quality-gate-report', label: 'Quality Gate' },
  { phase: 'documentation', persona: 'Paige — Technical Writer', workflowId: 'documentation.changelog-journal', label: 'Documentação Final' },
] as const;

const screen = blessed.screen({ smartCSR: true, title: 'WVS Orbit', fullUnicode: true });
const header = blessed.box({ parent: screen, top: 0, left: 0, width: '100%', height: 3, align: 'center', tags: true, style: { bg: 'blue', fg: 'white' } });
const journey = blessed.box({ parent: screen, top: 3, left: 0, width: '100%', height: 4, border: { type: 'line' }, label: ' Jornada ', tags: true, style: { border: { fg: 'cyan' } } });
const main = blessed.box({ parent: screen, top: 7, left: 0, width: '100%', height: '100%-11', border: { type: 'line' }, label: ' Conversa ', tags: true, scrollable: true, alwaysScroll: true, style: { border: { fg: 'yellow' } } });
const inputHint = blessed.box({ parent: screen, bottom: 3, left: 0, width: '100%', height: 1, tags: true, style: { fg: 'gray' } });
const input = blessed.textbox({
  parent: screen,
  bottom: 1,
  left: 0,
  width: '100%',
  height: 3,
  border: { type: 'line' },
  inputOnFocus: true,
  keys: true,
  mouse: true,
  style: {
    fg: 'white',
    bg: 'black',
    border: { fg: 'cyan' },
    focus: { border: { fg: 'magenta' } }
  }
});
const sys = blessed.box({ parent: screen, bottom: 0, left: 0, width: '100%', height: 1, tags: true, style: { fg: 'gray' } });

let ws: WebSocket | null = null;
let screenMode: ScreenMode = 'home';
let homeSelected = 0;
let expertSelected = 0;
let processing = false;
let processingLabel = '';
let pendingQuestionId: string | null = null;
let workflows: WorkflowSummary[] = [];
let expertCards: ExpertCard[] = [];
let sessions: SessionRecord[] = [];
let lines: string[] = ['⚙️ WVS Orbit pronto.'];

const sanitize = (line: string) => line.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
const add = (line: string) => {
  lines.push(sanitize(line));
  if (lines.length > 120) lines = lines.slice(-120);
};
const setSys = (line: string) => { sys.setContent(`⚙ ${line}`); };

function firstName(persona: string) { return persona.split('—')[0]?.trim() || persona; }
function avatar(persona: string) {
  const female = ['mary', 'sally', 'amelia', 'paige'].includes(firstName(persona).toLowerCase());
  if (USE_EMOJI) return female ? '👩' : '👨';
  return female ? '[F]' : '[M]';
}

function nextStep() {
  for (const s of GUIDED_FLOW) {
    const done = sessions.some((x) => x.runMode === 'guided' && x.phase === s.phase && x.status === 'done');
    if (!done) return s;
  }
  return null;
}

function renderHeader() {
  const m = screenMode.toUpperCase();
  const p = processing ? ` | PROCESSANDO: ${processingLabel}` : '';
  header.setContent(`WVS Orbit — Powered by WVS Systems | ${m}${p}`);
}

function renderJourney() {
  const done = GUIDED_FLOW.filter((s) => sessions.some((x) => x.runMode === 'guided' && x.phase === s.phase && x.status === 'done')).length;
  const width = 20;
  const fill = Math.round((done / GUIDED_FLOW.length) * width);
  const bar = `[${'█'.repeat(fill)}${'░'.repeat(width - fill)}] ${Math.round((done / GUIDED_FLOW.length) * 100)}%`;
  journey.setContent(`Progresso: ${bar}\n${GUIDED_FLOW.map((s) => s.label).join('  •  ')}`);
}

function wrapLine(line: string, width = 120) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > width) {
    out.push(rest.slice(0, width));
    rest = rest.slice(width);
  }
  out.push(rest);
  return out;
}

function convoBlock(limit: number, width = 120) {
  return lines.slice(-limit).flatMap((x) => [...wrapLine(x, width), '']);
}

function renderMain() {
  if (screenMode === 'home') {
    main.setLabel(' Sessão Inicial ');
    const opts = ['Jornada Guiada (do zero)', 'Consulta Especialista (pontual)'];
    main.setContent([
      'Como quer começar?',
      '',
      ...opts.map((o, i) => `${homeSelected === i ? '➤' : ' '} ${o}`),
      '',
      'Guided: sem workflow técnico, com condução por etapas.',
      'Expert: escolhe especialista por card.',
    ].join('\n'));
    inputHint.setContent('Use ↑/↓ e Enter');
    input.hide();
    return;
  }

  if (screenMode === 'expert') {
    main.setLabel(' Expert ');
    const sel = expertCards[expertSelected];
    main.setContent([
      ...expertCards.map((c, i) => `${i === expertSelected ? '➤' : ' '} ${c.personaName} (${c.phase})`),
      '',
      sel ? `${avatar(sel.personaName)} ${firstName(sel.personaName)}: ${sel.summary}` : '',
      '',
      ...convoBlock(10)
    ].join('\n'));
    inputHint.setContent(processing ? 'Aguarde o agente concluir...' : '↑/↓ escolhe | Enter executa | h home');
    input.hide();
    return;
  }

  const step = nextStep();
  main.setLabel(' Guided ');
  main.setContent([
    step ? `${avatar(step.persona)} ${firstName(step.persona)} • ${step.label}` : '✅ Jornada concluída',
    processing ? 'Agente processando... aguarde' : 'Pressione Enter para avançar etapa',
    '',
    ...convoBlock(14)
  ].join('\n'));

  if (pendingQuestionId) {
    inputHint.setContent('Responda e pressione Enter');
    input.show();
    input.focus();
    input.readInput();
  } else {
    inputHint.setContent('Enter avança etapa | h home');
    input.hide();
  }
}

function renderAll() { renderHeader(); renderJourney(); renderMain(); screen.render(); }

async function refreshData() {
  try {
    const [wr, sr] = await Promise.all([fetch(`${API_BASE}/workflows`), fetch(`${API_BASE}/sessions`)]);
    const w = (await wr.json()) as { workflows: WorkflowSummary[] };
    const s = (await sr.json()) as { sessions: SessionRecord[] };
    workflows = w.workflows ?? [];
    sessions = (s.sessions ?? []).map((x) => ({ ...x, runMode: x.runMode ?? 'guided', phase: x.phase ?? x.workflow.split('.')[0] }));
    const m = new Map<string, ExpertCard>();
    for (const wf of workflows) {
      if (!m.has(wf.persona)) m.set(wf.persona, { personaName: wf.personaName, phase: wf.phase, workflowId: wf.id, summary: wf.summary });
    }
    expertCards = [...m.values()];
  } catch (e) {
    setSys(`erro no refresh: ${String(e)}`);
  }
  renderAll();
}

function sendRun(workflowId: string, mode: Mode) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return setSys('MCP offline');
  if (processing) return setSys('já existe execução em andamento');
  processing = true;
  processingLabel = workflowId;
  const contextSnippet = lines.slice(-10).join(' | ');
  const step = GUIDED_FLOW.find((s) => s.workflowId === workflowId);
  const contextualInput = mode === 'guided'
    ? `Contexto da jornada: ${contextSnippet}. Etapa atual: ${step?.label ?? workflowId}.`
    : `Consulta especialista com contexto: ${contextSnippet}`;

  ws.send(JSON.stringify({
    id: `run-${Date.now()}`,
    type: 'workflow.run',
    workflowId,
    sessionId: `ses-${Date.now()}`,
    runMode: mode,
    input: contextualInput
  }));
  add(`⚙️ Execução iniciada: ${workflowId}`);
  renderAll();
}

function connect() {
  ws = new WebSocket(`${API_BASE.replace('http', 'ws')}/mcp?access_token=${ACCESS_TOKEN}`);
  ws.onopen = () => setSys('MCP conectado');
  ws.onclose = () => setSys('MCP desconectado');
  ws.onerror = () => setSys('erro de conexão MCP');
  ws.onmessage = (ev) => {
    try {
      const m = JSON.parse(String(ev.data));
      if (m.type === 'workflow.run.started') {
        const step = GUIDED_FLOW.find((x) => x.workflowId === m.workflowId);
        if (step && m.runMode === 'guided') add(`${avatar(step.persona)} ${firstName(step.persona)}: vamos começar ${step.label}.`);
      }
      if (m.type === 'workflow.question') {
        pendingQuestionId = m.questionId;
        const step = GUIDED_FLOW.find((x) => x.workflowId === processingLabel);
        const who = step ? `${avatar(step.persona)} ${firstName(step.persona)}` : '🤖 Agente';
        add(`${who}: ${m.prompt}`);
      }
      if (m.type === 'workflow.run.error') {
        processing = false;
        pendingQuestionId = null;
        add(`⚙️ Erro: ${m.error}`);
      }
      if (m.type === 'workflow.run.completed') {
        processing = false;
        pendingQuestionId = null;
        add(`⚙️ Etapa concluída: ${m.workflowId}`);
        void refreshData();
      }
    } catch {}
    renderAll();
  };
}

input.on('submit', (v) => {
  const answer = String(v ?? '').trim();
  if (!pendingQuestionId || !ws || ws.readyState !== WebSocket.OPEN) {
    setSys('sem pergunta pendente para responder');
    return;
  }
  if (!answer) {
    setSys('resposta vazia não é permitida');
    input.focus();
    screen.render();
    return;
  }
  ws.send(JSON.stringify({ type: 'workflow.answer', questionId: pendingQuestionId, answer }));
  add(`🧑 Você: ${answer}`);
  pendingQuestionId = null;
  input.setValue('');
  renderAll();
});

screen.key(['q', 'C-c'], () => process.exit(0));
screen.key(['r'], () => void refreshData());
screen.key(['h'], () => { if (!processing) { screenMode = 'home'; renderAll(); } });
screen.key(['up', 'k'], () => {
  if (processing) return;
  if (screenMode === 'home') homeSelected = homeSelected <= 0 ? 1 : homeSelected - 1;
  if (screenMode === 'expert' && expertCards.length > 0) expertSelected = expertSelected <= 0 ? expertCards.length - 1 : expertSelected - 1;
  renderAll();
});
screen.key(['down', 'j'], () => {
  if (processing) return;
  if (screenMode === 'home') homeSelected = (homeSelected + 1) % 2;
  if (screenMode === 'expert' && expertCards.length > 0) expertSelected = (expertSelected + 1) % expertCards.length;
  renderAll();
});
screen.key(['enter'], () => {
  if (pendingQuestionId) {
    input.focus();
    return;
  }

  if (screenMode === 'home') {
    screenMode = homeSelected === 0 ? 'guided' : 'expert';
    if (screenMode === 'guided') add(`${avatar('Mary — Business Analyst')} Mary: me conta sua ideia e o problema que você quer resolver.`);
    renderAll();
    return;
  }
  if (screenMode === 'guided') {
    const step = nextStep();
    if (step) sendRun(step.workflowId, 'guided');
    return;
  }
  if (screenMode === 'expert') {
    const sel = expertCards[expertSelected];
    if (sel) sendRun(sel.workflowId, 'expert');
  }
});

renderAll();
connect();
await refreshData();
setSys('UI pronta');
renderAll();
