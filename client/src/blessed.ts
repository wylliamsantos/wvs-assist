#!/usr/bin/env bun
import blessed from 'neo-blessed';

type Mode = 'guided' | 'expert';
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

const API_BASE = process.env.BMAD_API_URL || 'http://127.0.0.1:4000';
const ACCESS_TOKEN = process.env.BMAD_ACCESS_TOKEN || 'demo-access-token';
const PHASE_ORDER = ['analysis', 'planning', 'solutioning', 'implementation', 'testing', 'documentation'] as const;

const screen = blessed.screen({
  smartCSR: true,
  title: 'BMAD Orchestrator (NeoBlessed)',
  fullUnicode: true,
});

const header = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  tags: true,
  style: { bg: 'magenta', fg: 'black' },
  content: ' BMAD Orchestrator | [g] guided [e] expert [r] refresh [i] import expert->guided [enter] run [q] quit '
});

const timeline = blessed.box({
  parent: screen,
  top: 3,
  left: 0,
  width: '30%',
  height: '100%-3',
  label: ' Journey / Gates ',
  border: { type: 'line' },
  style: { border: { fg: 'cyan' } },
  tags: true,
});

const workflowsPanel = blessed.box({
  parent: screen,
  top: 3,
  left: '30%',
  width: '40%',
  height: '65%-3',
  label: ' Workflows ',
  border: { type: 'line' },
  style: { border: { fg: 'yellow' } },
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true,
});

const details = blessed.box({
  parent: screen,
  top: 3,
  left: '70%',
  width: '30%',
  height: '65%-3',
  label: ' Selection ',
  border: { type: 'line' },
  style: { border: { fg: 'white' } },
  tags: true,
});

const logs = blessed.log({
  parent: screen,
  top: '65%',
  left: '30%',
  width: '70%',
  height: '35%',
  label: ' Activity Log ',
  border: { type: 'line' },
  style: { border: { fg: 'green' } },
  tags: true,
  scrollback: 400,
});

let mode: Mode = 'guided';
let workflows: WorkflowSummary[] = [];
let sessions: SessionRecord[] = [];
let selectedIndex = 0;
let ws: WebSocket | null = null;

function log(msg: string) {
  logs.log(`[${new Date().toISOString()}] ${msg}`);
}

function phaseStatus(phase: string): SessionStatus | 'blocked' | 'empty' {
  const inPhase = sessions.filter(s => s.phase === phase);
  if (inPhase.some(s => s.status === 'in-progress')) return 'in-progress';
  if (inPhase.some(s => s.status === 'done')) return 'done';
  if (inPhase.some(s => s.status === 'error')) return 'error';
  if (inPhase.length > 0) return inPhase[0].status;
  const idx = PHASE_ORDER.indexOf(phase as (typeof PHASE_ORDER)[number]);
  if (idx <= 0) return 'empty';
  const prev = PHASE_ORDER[idx - 1];
  const prevDone = sessions.some(s => s.phase === prev && s.status === 'done');
  return prevDone ? 'empty' : 'blocked';
}

function colorTag(status: string) {
  switch (status) {
    case 'done': return '{green-fg}done{/green-fg}';
    case 'in-progress': return '{yellow-fg}in-progress{/yellow-fg}';
    case 'error': return '{red-fg}error{/red-fg}';
    case 'blocked': return '{red-fg}blocked{/red-fg}';
    default: return '{gray-fg}idle{/gray-fg}';
  }
}

function progressBar(done: number, total: number, width = 18) {
  const ratio = total <= 0 ? 0 : done / total;
  const filled = Math.round(width * ratio);
  return `[${'█'.repeat(filled)}${'░'.repeat(Math.max(0, width - filled))}] ${Math.round(ratio * 100)}%`;
}

function phaseDoneCount() {
  const done = PHASE_ORDER.filter((phase) => phaseStatus(phase) === 'done').length;
  return { done, total: PHASE_ORDER.length };
}

function pendingForSelectedWorkflow() {
  const selected = workflows[selectedIndex];
  if (!selected) return ['Selecione um workflow'];
  if (mode === 'expert') return ['Sem gate obrigatório (modo especialista).', 'Sugestão: importar output para sessão guided.'];

  const idx = PHASE_ORDER.indexOf(selected.phase as (typeof PHASE_ORDER)[number]);
  if (idx <= 0) return ['Nenhuma pendência de gate para esta fase.'];

  const prev = PHASE_ORDER[idx - 1];
  const prevDone = sessions.some((s) => s.phase === prev && s.status === 'done');
  if (prevDone) return ['Gate anterior satisfeito.', 'Pode executar em modo guided.'];
  return [
    `Pendência: concluir uma sessão da fase '${prev}'.`,
    'Ou rode em modo expert (atalho) e importe evidência depois.'
  ];
}

function renderTimeline() {
  const p = phaseDoneCount();
  const lines = [
    `{bold}Mode:{/bold} ${mode}`,
    mode === 'guided' ? '{cyan-fg}Gate ativo entre fases{/cyan-fg}' : '{yellow-fg}Modo especialista (sem gate){/yellow-fg}',
    `{bold}Progresso:{/bold} ${progressBar(p.done, p.total)}`,
    ''
  ];
  for (const phase of PHASE_ORDER) {
    const status = phaseStatus(phase);
    lines.push(`• ${phase.padEnd(15)} ${colorTag(status)}`);
  }
  timeline.setContent(lines.join('\n'));
}

function renderWorkflows() {
  if (workflows.length === 0) {
    workflowsPanel.setContent('{gray-fg}Sem workflows carregados{/gray-fg}');
    return;
  }
  const rows = workflows.map((w, idx) => {
    const cursor = idx === selectedIndex ? '{magenta-fg}➤{/magenta-fg}' : ' ';
    return `${cursor} ${w.id}`;
  });
  workflowsPanel.setContent(rows.join('\n'));
}

function renderDetails() {
  const selected = workflows[selectedIndex];
  if (!selected) {
    details.setContent('{gray-fg}Selecione um workflow{/gray-fg}');
    return;
  }
  const pending = pendingForSelectedWorkflow();
  const latestGuided = sessions
    .filter((s) => s.runMode === 'guided')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  const txt = [
    `{bold}${selected.id}{/bold}`,
    '',
    `{gray-fg}Persona:{/gray-fg} ${selected.personaName}`,
    `{gray-fg}Fase:{/gray-fg} ${selected.phase}`,
    '',
    `{gray-fg}Modo de execução:{/gray-fg}`,
    mode === 'guided' ? 'Jornada completa (gate)' : 'Especialista (atalho)',
    '',
    '{gray-fg}Pendências p/ avançar:{/gray-fg}',
    ...pending.map((line) => `- ${line}`),
    '',
    `{gray-fg}Importações (guided atual):{/gray-fg} ${latestGuided?.importedFrom?.length ?? 0}`,
    '{gray-fg}Atalho:{/gray-fg} pressione [i] para importar evidência expert -> guided',
    '',
    '{gray-fg}Resumo:{/gray-fg}',
    selected.summary
  ];
  details.setContent(txt.join('\n'));
}

async function refreshData() {
  try {
    const [wRes, sRes] = await Promise.all([
      fetch(`${API_BASE}/workflows`),
      fetch(`${API_BASE}/sessions`)
    ]);
    const wData = (await wRes.json()) as { workflows: WorkflowSummary[] };
    const sData = (await sRes.json()) as { sessions: SessionRecord[] };
    workflows = wData.workflows ?? [];
    sessions = (sData.sessions ?? []).map((s) => ({ ...s, runMode: s.runMode ?? 'guided', phase: s.phase ?? s.workflow.split('.')[0] }));
    if (selectedIndex >= workflows.length) selectedIndex = Math.max(0, workflows.length - 1);
    renderTimeline();
    renderWorkflows();
    renderDetails();
    log(`Refresh ok: ${workflows.length} workflows, ${sessions.length} sessions`);
    screen.render();
  } catch (err) {
    log(`Refresh error: ${String(err)}`);
    screen.render();
  }
}

function connectMcp() {
  ws = new WebSocket(`${API_BASE.replace('http', 'ws')}/mcp?access_token=${ACCESS_TOKEN}`);
  ws.onopen = () => log('MCP conectado');
  ws.onclose = () => log('MCP desconectado');
  ws.onerror = () => log('MCP erro de conexão');
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(String(ev.data));
      if (msg.type === 'workflow.run.started') log(`Run started: ${msg.workflowId} (${msg.runMode})`);
      if (msg.type === 'workflow.run.error') log(`Run error: ${msg.error}`);
      if (msg.type === 'workflow.run.completed') {
        log(`Run completed: ${msg.workflowId}`);
        void refreshData();
      }
    } catch {
      log(`MCP msg: ${String(ev.data).slice(0, 120)}`);
    }
    screen.render();
  };
}

function runSelectedWorkflow() {
  const selected = workflows[selectedIndex];
  if (!selected || !ws || ws.readyState !== WebSocket.OPEN) {
    log('Não foi possível iniciar: workflow ausente ou MCP offline');
    screen.render();
    return;
  }
  const runId = `run-${Date.now()}`;
  const sessionId = `ses-${Date.now()}`;
  ws.send(JSON.stringify({
    id: runId,
    type: 'workflow.run',
    workflowId: selected.id,
    sessionId,
    runMode: mode,
    input: `Execução via NeoBlessed em modo ${mode}`
  }));
  log(`Run enviado: ${selected.id} [${mode}]`);
  screen.render();
}

async function importLatestExpertIntoGuided() {
  const selected = workflows[selectedIndex];
  if (!selected) {
    log('Sem workflow selecionado para importar evidência.');
    return;
  }

  const source = sessions
    .filter((s) => s.runMode === 'expert' && s.status === 'done' && s.phase === selected.phase)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  const target = sessions
    .filter((s) => s.runMode === 'guided' && s.phase === selected.phase)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  if (!source) {
    log(`Nenhuma sessão expert concluída encontrada na fase '${selected.phase}'.`);
    return;
  }
  if (!target) {
    log(`Nenhuma sessão guided encontrada na fase '${selected.phase}' para receber import.`);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/sessions/import-expert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceSessionId: source.id, targetSessionId: target.id })
    });
    const body = await res.json();
    if (!res.ok || !body?.ok) {
      log(`Falha ao importar evidência: ${body?.error ?? res.status}`);
      return;
    }
    log(`Importado expert->guided: ${source.id} => ${target.id}`);
    await refreshData();
  } catch (err) {
    log(`Erro no import: ${String(err)}`);
  }
}

screen.key(['q', 'C-c'], () => process.exit(0));
screen.key(['g'], () => { mode = 'guided'; renderTimeline(); renderDetails(); log('Modo guided'); screen.render(); });
screen.key(['e'], () => { mode = 'expert'; renderTimeline(); renderDetails(); log('Modo expert'); screen.render(); });
screen.key(['r'], () => { void refreshData(); });
screen.key(['i'], () => { void importLatestExpertIntoGuided(); });
screen.key(['up', 'k'], () => {
  if (workflows.length === 0) return;
  selectedIndex = selectedIndex <= 0 ? workflows.length - 1 : selectedIndex - 1;
  renderWorkflows();
  renderDetails();
  screen.render();
});
screen.key(['down', 'j'], () => {
  if (workflows.length === 0) return;
  selectedIndex = (selectedIndex + 1) % workflows.length;
  renderWorkflows();
  renderDetails();
  screen.render();
});
screen.key(['enter'], () => runSelectedWorkflow());

connectMcp();
await refreshData();
log('NeoBlessed UI pronta');
screen.render();
