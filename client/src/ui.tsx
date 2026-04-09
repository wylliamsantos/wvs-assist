import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {useCatalog, useMcpConnection, useWorkflows} from './api';
import {useSessions} from './sessions';
import type {SessionRecord} from './storage';

type Screen = 'home' | 'agents' | 'sessions' | 'logs';
type TranscriptKind = 'step' | 'question' | 'answer' | 'output' | 'error' | 'artifact' | 'system';
type TranscriptEntry = {kind: TranscriptKind; text: string};
type PendingQuestion = {
  sessionId: string;
  questionId: string;
  prompt: string;
  answer: string;
};

type GuidedStep = {
  id: string;
  label: string;
  description: string;
  agentId: string;
  workflowId: string;
};

type GuidedStepStatus = 'ready' | 'locked' | 'in-progress' | 'done';
type GuidedState = {
  step: GuidedStep;
  agentName: string;
  status: GuidedStepStatus;
  session: SessionRecord | null;
};

const menuItems: {label: string; screen: Screen}[] = [
  {label: 'Home', screen: 'home'},
  {label: 'Agents', screen: 'agents'},
  {label: 'Sessions', screen: 'sessions'},
  {label: 'Logs', screen: 'logs'},
];

const sessionsMenuIndex = menuItems.findIndex(item => item.screen === 'sessions');

const guidedFlow: GuidedStep[] = [
  {
    id: 'phase-analysis-problem',
    label: 'Descoberta do Problema',
    description: 'Converse com Mary para mapear dores, hipóteses e KPIs iniciais.',
    agentId: 'mary-analyst',
    workflowId: 'analysis.problem-tree',
  },
  {
    id: 'phase-analysis-brief',
    label: 'Product Brief e Pesquisa',
    description: 'Mary consolida visão, escopo inicial e pesquisas.',
    agentId: 'mary-analyst',
    workflowId: 'analysis.product-brief',
  },
  {
    id: 'phase-planning-prd',
    label: 'Planejamento do Produto',
    description: 'John transforma o contexto em PRD e epics.',
    agentId: 'john-pm',
    workflowId: 'planning.create-prd',
  },
  {
    id: 'phase-planning-ux',
    label: 'UX & Experiência',
    description: 'Sally valida fluxos e experiência do usuário.',
    agentId: 'sally-ux',
    workflowId: 'planning.create-design',
  },
  {
    id: 'phase-solution-architecture',
    label: 'Arquitetura Técnica',
    description: 'Winston define arquitetura e integrações.',
    agentId: 'winston-architect',
    workflowId: 'solutioning.create-architecture',
  },
  {
    id: 'phase-solution-nfr',
    label: 'Segurança & NFRs',
    description: 'Winston valida requisitos não-funcionais críticos.',
    agentId: 'winston-architect',
    workflowId: 'solutioning.nfr-assessment',
  },
  {
    id: 'phase-implementation-sprint',
    label: 'Preparar Sprint',
    description: 'Bob sincroniza backlog, owners e handoffs.',
    agentId: 'bob-scrum',
    workflowId: 'implementation.sprint-planning',
  },
  {
    id: 'phase-implementation-dev',
    label: 'Execução das Stories',
    description: 'Amelia roda o workflow de desenvolvimento.',
    agentId: 'amelia-dev',
    workflowId: 'implementation.develop-story',
  },
  {
    id: 'phase-testing-quality',
    label: 'Quality Gate',
    description: 'Murat consolida métricas e recomenda go/no-go.',
    agentId: 'murat-qa',
    workflowId: 'testing.quality-gate-report',
  },
  {
    id: 'phase-documentation',
    label: 'Documentação Final',
    description: 'Paige registra changelog e referências.',
    agentId: 'paige-writer',
    workflowId: 'documentation.changelog-journal',
  },
];

const mockLogs = [
  '[17:32:10] auth.login success (tenant=demo)',
  '[17:32:11] mcp.connect -> OK',
  '[17:32:12] workflow plan.feature-spec started',
  '[17:33:05] suggestion ready',
  '[17:34:20] telemetry sent',
];

const MAX_TRANSCRIPT_LINES = 12;

const spinnerChars = ['|', '/', '-', '\\'];

export const App = () => {
  const {catalog, loading, error, tokens, apiBase} = useCatalog();
  const {workflows, loading: workflowsLoading, error: workflowsError} = useWorkflows(apiBase);
  const {sessions, addSession, updateSessionStatus, refresh} = useSessions(apiBase);
  const {status: mcpStatus, lastMessage, lastEvent, send} = useMcpConnection(tokens, apiBase);

  const {exit} = useApp();
  const columns = process.stdout.columns ?? 120;
  const rows = process.stdout.rows ?? 32;
  const isCompact = columns < 120;

  const [menuIndex, setMenuIndex] = useState(0);
  const selectedScreen = menuItems[menuIndex]?.screen ?? 'home';

  const [agentsCursor, setAgentsCursor] = useState({agentIndex: 0, workflowIndex: 0});
  const [homeCursor, setHomeCursor] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null);
  const [sessionOutputs, setSessionOutputs] = useState<Record<string, TranscriptEntry[]>>({});
  const [pendingStages, setPendingStages] = useState<Record<string, string | null>>({});
  const [transcriptOffsets, setTranscriptOffsets] = useState<Record<string, number>>({});
  const [spinnerFrame, setSpinnerFrame] = useState(0);
  const [focusTarget, setFocusTarget] = useState<'menu' | 'content'>('menu');

  const answeredQuestionsRef = useRef(new Set<string>());
  const runMapRef = useRef(new Map<string, string>());

  const agentMap = useMemo(() => {
    const map = new Map<string, {displayName: string}>();
    catalog?.agents.forEach(agent => {
      map.set(agent.id, {displayName: agent.displayName});
    });
    return map;
  }, [catalog]);

  const activeSession = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    return sessions.find(s => s.id === activeSessionId) ?? sessions[0];
  }, [sessions, activeSessionId]);

  useEffect(() => {
    if (sessions.length === 0) return;
    setActiveSessionId(prev => prev ?? sessions[0].id);
  }, [sessions]);

  useEffect(() => {
    if (!catalog || catalog.agents.length === 0) return;
    setAgentsCursor(prev => {
      const nextAgentIndex = Math.min(prev.agentIndex, catalog.agents.length - 1);
      const workflows = catalog.agents[nextAgentIndex]?.workflows ?? [];
      const nextWorkflowIndex = workflows.length === 0 ? 0 : Math.min(prev.workflowIndex, workflows.length - 1);
      return {agentIndex: nextAgentIndex, workflowIndex: nextWorkflowIndex};
    });
  }, [catalog]);

  const appendTranscript = useCallback((sessionId: string, entry: TranscriptEntry) => {
    setSessionOutputs(prev => {
      const history = prev[sessionId] ?? [];
      return {...prev, [sessionId]: [...history, entry]};
    });
    setTranscriptOffsets(prev => ({...prev, [sessionId]: 0}));
  }, []);

  const spinnerActive = useMemo(() => Object.values(pendingStages).some(Boolean), [pendingStages]);
  useEffect(() => {
    if (!spinnerActive) return;
    const id = setInterval(() => {
      setSpinnerFrame(prev => (prev + 1) % spinnerChars.length);
    }, 120);
    return () => clearInterval(id);
  }, [spinnerActive]);

  const adjustTranscriptScroll = useCallback((sessionId: string | null, delta: number) => {
    if (!sessionId) return;
    setTranscriptOffsets(prev => {
      const current = prev[sessionId] ?? 0;
      const next = Math.max(0, current + delta);
      return {...prev, [sessionId]: next};
    });
  }, []);

  useEffect(() => {
    if (selectedScreen !== 'agents') return;
    const agent = catalog?.agents[agentsCursor.agentIndex];
    if (!agent) return;
    const matching = sessions.filter(session => session.agentId === agent.id);
    if (matching.length === 0) return;
    const latest = matching.reduce((prev, next) =>
      new Date(next.updatedAt).getTime() > new Date(prev.updatedAt).getTime() ? next : prev,
    );
    if (latest && latest.id !== activeSessionId) {
      setActiveSessionId(latest.id);
    }
  }, [selectedScreen, agentsCursor, sessions, catalog, activeSessionId]);

  // mantém foco inicial no menu; usuário alterna com Tab/Setas

  const startWorkflow = useCallback(
    (agentId: string, workflowId: string, note?: string) => {
      if (!catalog) {
        setActionMessage('Catálogo não carregado ainda.');
        return null;
      }
      const agent = catalog.agents.find(item => item.id === agentId);
      if (!agent) {
        setActionMessage('Agente não encontrado.');
        return null;
      }
      if (!agent.workflows.includes(workflowId)) {
        setActionMessage('Workflow indisponível para este agente.');
        return null;
      }

      const sessionId = `ses-${Date.now()}`;
      const now = new Date().toISOString();
      addSession({
        id: sessionId,
        agentId: agent.id,
        agentName: agent.displayName,
        workflow: workflowId,
        status: 'drafted',
        startedAt: now,
        updatedAt: now,
      });
      setActiveSessionId(sessionId);
      setFocusTarget('content');

      const runId = `run-${Date.now()}`;
      const sent = send({
        id: runId,
        type: 'workflow.run',
        workflowId,
        persona: agent.id,
        sessionId,
        input: note ?? `Fluxo ${workflowId} iniciado via console para ${agent.displayName}.`,
      });
      runMapRef.current.set(runId, sessionId);
      setActionMessage(
        `Sessão ${sessionId} • ${workflowId} (${sent ? 'workflow enviado' : 'aguardando MCP'})`
      );
      return sessionId;
    },
    [catalog, addSession, send]
  );

  const startAgentSession = useCallback(() => {
    if (!catalog) return;
    const agent = catalog.agents[agentsCursor.agentIndex];
    if (!agent) return;
    const workflow = agent.workflows[agentsCursor.workflowIndex];
    if (!workflow) {
      setActionMessage('Agente sem workflows configurados.');
      return;
    }
    startWorkflow(
      agent.id,
      workflow,
      `Sessão iniciada manualmente para ${agent.displayName} executando ${workflow}.`
    );
  }, [catalog, agentsCursor, startWorkflow]);

  useEffect(() => {
    if (!pendingQuestion) return;
    setPendingQuestion(prev => (prev ? {...prev, answer: ''} : null));
  }, [activeSessionId]);

  const activeId = activeSession?.id;
  useEffect(() => {
    if (!pendingQuestion || pendingQuestion.sessionId === activeId) return;
    setPendingQuestion(null);
  }, [activeId, pendingQuestion]);

  const submitAnswer = useCallback(() => {
    if (!pendingQuestion) return;
    const answerText = pendingQuestion.answer.trim();
    if (!answerText) return;
    appendTranscript(pendingQuestion.sessionId, {
      kind: 'question',
      text: `Pergunta do agente: ${pendingQuestion.prompt}`,
    });
    answeredQuestionsRef.current.add(pendingQuestion.questionId);
    send({
      type: 'workflow.answer',
      sessionId: pendingQuestion.sessionId,
      questionId: pendingQuestion.questionId,
      answer: answerText,
    });
    appendTranscript(pendingQuestion.sessionId, {kind: 'answer', text: `Você: ${answerText}`});
    setPendingQuestion(null);
  }, [pendingQuestion, send, appendTranscript]);

  useEffect(() => {
    if (!catalog) return;
    if (!lastEvent) return;
    const event = lastEvent as {
      type?: string;
      id?: string;
      sessionId?: string;
      workflowId?: string;
      output?: string;
      error?: string;
      stepType?: string;
      step?: Record<string, unknown>;
      stage?: string;
      questionId?: string;
      prompt?: string;
      artifact?: {path: string; description: string};
      answer?: string;
    };
    if (!event.type) return;
    const sessionId = event.sessionId || (event.id ? runMapRef.current.get(event.id) : undefined);
    if (!sessionId) return;

    switch (event.type) {
      case 'workflow.run.started':
        updateSessionStatus(sessionId, 'in-progress');
        setPendingStages(prev => ({...prev, [sessionId]: describeStage('inputs')}));
        appendTranscript(sessionId, {kind: 'system', text: 'Workflow iniciado.'});
        break;
      case 'workflow.step': {
        appendTranscript(sessionId, {
          kind: 'step',
          text: describeStep(event.stepType, event.step),
        });
        break;
      }
      case 'workflow.question': {
        if (event.prompt) {
          appendTranscript(sessionId, {
            kind: 'question',
            text: `Agente pergunta: ${event.prompt}`,
          });
        }
        setPendingQuestion({
          sessionId,
          questionId: event.questionId ?? `${event.id}-question`,
          prompt: event.prompt ?? 'Forneça detalhes:',
          answer: '',
        });
        setActiveSessionId(sessionId);
        break;
      }
      case 'workflow.answer':
        if (event.questionId && answeredQuestionsRef.current.has(event.questionId)) {
          answeredQuestionsRef.current.delete(event.questionId);
          break;
        }
        appendTranscript(sessionId, {kind: 'answer', text: `Agente: ${event.answer ?? '(vazio)'}`});
        break;
      case 'workflow.run.pending':
        setPendingStages(prev => ({...prev, [sessionId]: describeStage(event.stage)}));
        appendTranscript(sessionId, {
          kind: 'system',
          text: stageMessage(event.stage),
        });
        break;
      case 'workflow.run.output.delta':
        if (event.chunk) {
          appendTranscript(sessionId, {kind: 'output', text: event.chunk});
        }
        break;
      case 'workflow.run.output': {
        setPendingStages(prev => ({...prev, [sessionId]: null}));
        const output = (event.output ?? '').trim();
        appendTranscript(sessionId, {
          kind: 'output',
          text: output.length > 0 ? output : 'Sem saída textual; verifique os artefatos acima.',
        });
        break;
      }
      case 'workflow.artifact':
        if (event.artifact) {
          appendTranscript(sessionId, {
            kind: 'system',
            text: `Criando arquivo ${event.artifact.path}...`,
          });
          appendTranscript(sessionId, {
            kind: 'artifact',
            text: formatArtifactEntry(event.artifact),
          });
        }
        break;
      case 'workflow.run.completed':
        updateSessionStatus(sessionId, 'done');
        refresh();
        runMapRef.current.delete(event.id ?? '');
        setPendingStages(prev => ({...prev, [sessionId]: null}));
        appendTranscript(sessionId, {kind: 'system', text: 'Workflow concluído.'});
        break;
      case 'workflow.run.error':
        updateSessionStatus(sessionId, 'error');
        refresh();
        runMapRef.current.delete(event.id ?? '');
        setPendingStages(prev => ({...prev, [sessionId]: null}));
        appendTranscript(sessionId, {kind: 'error', text: event.error ?? 'Erro desconhecido'});
        break;
      default:
        break;
    }
  }, [lastEvent, catalog, appendTranscript, updateSessionStatus, refresh]);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    if (pendingQuestion) {
      if (key.return) {
        submitAnswer();
        return;
      }
      if (key.escape) {
        setPendingQuestion(null);
        return;
      }
      if (key.backspace || key.delete) {
        setPendingQuestion(prev => (prev ? {...prev, answer: prev.answer.slice(0, -1)} : prev));
        return;
      }
      if (!key.meta && !key.ctrl && input) {
        setPendingQuestion(prev => (prev ? {...prev, answer: prev.answer + input} : prev));
      }
      return;
    }

    if (key.escape || input === 'q') {
      setFocusTarget('menu');
      setMenuIndex(0);
      return;
    }

    if (key.tab || input === '\t') {
      setFocusTarget(prev => (prev === 'menu' ? 'content' : 'menu'));
      return;
    }
    if (key.rightArrow && focusTarget === 'menu') {
      setFocusTarget('content');
      return;
    }
    if (key.leftArrow && focusTarget === 'content') {
      setFocusTarget('menu');
      return;
    }

    if (focusTarget === 'menu') {
      if (key.upArrow) {
        setMenuIndex(prev => (prev - 1 + menuItems.length) % menuItems.length);
      } else if (key.downArrow) {
        setMenuIndex(prev => (prev + 1) % menuItems.length);
      }
      return;
    }

    const canScrollTranscript =
      (selectedScreen === 'agents' || selectedScreen === 'sessions') &&
      focusTarget === 'content' &&
      activeSessionId;
    if (canScrollTranscript) {
      if (key.pageUp) {
        adjustTranscriptScroll(activeSessionId, MAX_TRANSCRIPT_LINES);
        return;
      }
      if (key.pageDown) {
        adjustTranscriptScroll(activeSessionId, -MAX_TRANSCRIPT_LINES);
        return;
      }
    }

    if (selectedScreen === 'agents') {
      if (pendingQuestion) {
        if (key.return && pendingQuestion.answer.trim().length === 0) return;
      }
      if (focusTarget !== 'content') return;
      if (key.upArrow) {
        setAgentsCursor(prev => ({
          agentIndex: prev.agentIndex === 0 ? (catalog?.agents.length ?? 1) - 1 : prev.agentIndex - 1,
          workflowIndex: 0,
        }));
        return;
      }
      if (key.downArrow) {
        setAgentsCursor(prev => ({
          agentIndex: catalog && catalog.agents.length > 0 ? (prev.agentIndex + 1) % catalog.agents.length : 0,
          workflowIndex: 0,
        }));
        return;
      }
      if (key.leftArrow) {
        setAgentsCursor(prev => ({
          ...prev,
          workflowIndex: prev.workflowIndex === 0 ? prev.workflowIndex : prev.workflowIndex - 1,
        }));
        return;
      }
      if (key.rightArrow) {
        setAgentsCursor(prev => {
          const agent = catalog?.agents[prev.agentIndex];
          const total = agent?.workflows.length ?? 0;
          if (total === 0) return prev;
          return {...prev, workflowIndex: (prev.workflowIndex + 1) % total};
        });
        return;
      }
      if (key.return) {
        startAgentSession();
        return;
      }
    }

    if (selectedScreen === 'sessions') {
      if (focusTarget !== 'content') return;
      if (key.upArrow || key.downArrow) {
        const list = sessions;
        if (list.length === 0) return;
        const currentIndex = list.findIndex(s => s.id === (activeSession?.id ?? ''));
        if (currentIndex === -1) {
          setActiveSessionId(list[0].id);
          return;
        }
        if (key.upArrow) {
          const previous = currentIndex === 0 ? list.length - 1 : currentIndex - 1;
          setActiveSessionId(list[previous].id);
        } else if (key.downArrow) {
          const next = (currentIndex + 1) % list.length;
          setActiveSessionId(list[next].id);
        }
        return;
      }
    }

    if (selectedScreen === 'home') {
      if (focusTarget !== 'content') return;
      if (key.upArrow) {
        setHomeCursor(prev => (prev - 1 + guidedFlow.length) % guidedFlow.length);
        return;
      }
      if (key.downArrow) {
        setHomeCursor(prev => (prev + 1) % guidedFlow.length);
        return;
      }
      if (key.return) {
        handleGuidedSelection();
        return;
      }
    }
  });

  const sidebarWidth = isCompact ? columns - 4 : 28;
  const mainWidth = isCompact ? Math.max(40, columns - 4) : Math.max(40, columns - sidebarWidth - 4);

  const workflowSessions = useMemo(() => {
    const map = new Map<string, SessionRecord>();
    sessions.forEach(session => {
      const current = map.get(session.workflow);
      if (!current || new Date(session.updatedAt).getTime() > new Date(current.updatedAt).getTime()) {
        map.set(session.workflow, session);
      }
    });
    return map;
  }, [sessions]);

  const guidedStates = useMemo(() => {
    let gating = true;
    return guidedFlow.map(step => {
      const agentName = agentMap.get(step.agentId)?.displayName ?? step.agentId;
      const session = workflowSessions.get(step.workflowId) ?? null;
      if (session) {
        if (session.status === 'done') {
          return {step, agentName, status: 'done', session} as GuidedState;
        }
        gating = false;
        return {step, agentName, status: 'in-progress', session} as GuidedState;
      }
      if (gating) {
        gating = false;
        return {step, agentName, status: 'ready', session: null} as GuidedState;
      }
      return {step, agentName, status: 'locked', session: null} as GuidedState;
    });
  }, [agentMap, workflowSessions]);

  const handleGuidedSelection = useCallback(() => {
    const state = guidedStates[homeCursor];
    if (!state) return;
    if (state.status === 'locked') {
      setActionMessage('Conclua a etapa anterior antes de seguir.');
      return;
    }
    if (state.session) {
      setActiveSessionId(state.session.id);
      if (sessionsMenuIndex >= 0) {
        setMenuIndex(sessionsMenuIndex);
        setFocusTarget('content');
      }
      return;
    }
    if (state.status === 'ready') {
      const created = startWorkflow(
        state.step.agentId,
        state.step.workflowId,
        `Fluxo guiado (${state.step.label}) disparado.`
      );
      if (created && sessionsMenuIndex >= 0) {
        setMenuIndex(sessionsMenuIndex);
        setFocusTarget('content');
      }
    }
  }, [guidedStates, homeCursor, startWorkflow]);

  const sidebar = (
    <Box
      width={isCompact ? columns - 4 : sidebarWidth}
      flexDirection="column"
      paddingX={1}
      borderStyle="single"
      borderColor="gray"
      marginBottom={isCompact ? 1 : 0}
    >
      <Text color="cyan">WVS Systems — BMAD Console</Text>
      <Box flexDirection="column" marginTop={1} maxHeight={12}>
        {menuItems.map((item, index) => {
          const isSelected = index === menuIndex;
          const color = isSelected ? (focusTarget === 'menu' ? 'magenta' : 'gray') : 'white';
          return (
            <Text key={item.screen} color={color}>
            {index === menuIndex ? '➤ ' : '  '}
            {item.label}
            </Text>
          );
        })}
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text color="gray">MCP: {mcpStatus}</Text>
        {lastMessage && <Text color="gray">Última msg: {truncate(lastMessage, sidebarWidth - 4)}</Text>}
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text color="gray">Catalog: {loading ? 'carregando...' : error ? `erro (${error})` : 'ok'}</Text>
        <Text color="gray">Workflows: {workflowsLoading ? 'carregando...' : workflowsError ? 'erro' : workflows.length}</Text>
      </Box>
      <Box flexGrow={1} />
      {actionMessage && (
        <Box marginBottom={1}>
          <Text color="yellow">{truncate(actionMessage, sidebarWidth - 2)}</Text>
        </Box>
      )}
      <Text dimColor>
        ↑/↓ menu • Tab/→ foca conteúdo • ← volta • Esc/Q volta ao menu • Ctrl+C sai
      </Text>
      {selectedScreen === 'home' && focusTarget === 'content' && (
        <Text dimColor>↑/↓ percorrem fases • Enter inicia/abre sessão guiada</Text>
      )}
      {selectedScreen === 'agents' && focusTarget === 'content' && (
        <Text dimColor>Use ↑/↓ para agente e ←/→ para workflow • Enter inicia</Text>
      )}
      {selectedScreen === 'sessions' && focusTarget === 'content' && (
        <Text dimColor>↑/↓ percorre sessões • Enter reservado</Text>
      )}
      {pendingQuestion && <Text color="magenta">Respondendo: digite texto + Enter</Text>}
      {focusTarget === 'content' && (selectedScreen === 'agents' || selectedScreen === 'sessions') && (
        <Text dimColor>PgUp/PgDn rolam mensagens do painel</Text>
      )}
    </Box>
  );

  const mainContent = (
    <Box flexGrow={1} paddingLeft={isCompact ? 0 : 1}>
      {selectedScreen === 'home' && (
        <HomeView
          catalogLoaded={!loading && !error}
          steps={guidedStates}
          cursor={homeCursor}
          focusTarget={focusTarget}
        />
      )}
      {selectedScreen === 'agents' && (
        <AgentsView
          catalogLoading={loading}
          catalogError={error}
          catalog={catalog}
          cursor={agentsCursor}
          focusTarget={focusTarget}
          activeSession={activeSession}
          transcript={activeSession ? sessionOutputs[activeSession.id] ?? [] : []}
          pendingStage={activeSession ? pendingStages[activeSession.id] ?? null : null}
          pendingQuestion={
            activeSession && pendingQuestion?.sessionId === activeSession.id ? pendingQuestion : null
          }
          spinnerFrame={spinnerFrame}
          scrollOffsets={transcriptOffsets}
        />
      )}
      {selectedScreen === 'sessions' && (
        <SessionsView
          sessions={sessions}
          activeSession={activeSession}
          transcript={activeSession ? sessionOutputs[activeSession.id] ?? [] : []}
          pendingStage={activeSession ? pendingStages[activeSession.id] ?? null : null}
          pendingQuestion={pendingQuestion}
          width={mainWidth}
          spinnerFrame={spinnerFrame}
          scrollOffsets={transcriptOffsets}
        />
      )}
      {selectedScreen === 'logs' && <LogsView />}
    </Box>
  );

  return (
    <Box flexDirection={isCompact ? 'column' : 'row'} width={columns} height={rows}>
      {sidebar}
      {mainContent}
    </Box>
  );
};

type AgentsViewProps = {
  catalogLoading: boolean;
  catalogError: string | null;
  catalog: ReturnType<typeof useCatalog>['catalog'];
  cursor: {agentIndex: number; workflowIndex: number};
  focusTarget: 'menu' | 'content';
  activeSession: SessionRecord | null;
  transcript: TranscriptEntry[];
  pendingStage: string | null;
  pendingQuestion: PendingQuestion | null;
  spinnerFrame: number;
  scrollOffsets: Record<string, number>;
};

const AgentsView = ({
  catalogLoading,
  catalogError,
  catalog,
  cursor,
  focusTarget,
  activeSession,
  transcript,
  pendingStage,
  pendingQuestion,
  spinnerFrame,
  scrollOffsets,
}: AgentsViewProps) => {
  if (catalogLoading) return <Text>Carregando catálogo...</Text>;
  if (catalogError || !catalog) return <Text color="red">Erro ao carregar catálogo.</Text>;
  if (catalog.agents.length === 0) return <Text>Nenhum agente cadastrado.</Text>;

  const activeScrollOffset = activeSession ? scrollOffsets[activeSession.id] ?? 0 : 0;

  return (
    <Box flexDirection="column" alignItems="center" width="100%">
      <Text>Use ↑/↓ para navegar os cards, ←/→ para trocar workflows e Enter para iniciar.</Text>
      <Box
        flexDirection="row"
        flexWrap="wrap"
        justifyContent="center"
        marginTop={1}
        width="100%"
        paddingX={1}
      >
        {catalog.agents.map((agent, index) => {
          const selectedAgent = index === cursor.agentIndex;
          const isFocused = focusTarget === 'content' && selectedAgent;
          return (
            <Box
              key={agent.id}
              width={38}
              minHeight={9}
              marginX={1}
              marginY={1}
              padding={1}
              borderStyle="round"
              borderColor={isFocused ? 'magenta' : 'gray'}
              flexDirection="column"
            >
              <Text color={isFocused ? 'magenta' : 'white'}>{agent.displayName}</Text>
              <Text color="gray">Workflows:</Text>
              {agent.workflows.length > 0 ? (
                agent.workflows.map((workflowId, wfIndex) => (
                  <Text
                    key={workflowId}
                    color={isFocused && wfIndex === cursor.workflowIndex ? 'cyan' : 'gray'}
                  >
                    {isFocused && wfIndex === cursor.workflowIndex ? '• ' : '  '}
                    {workflowId}
                  </Text>
                ))
              ) : (
                <Text color="gray">(sem workflows)</Text>
              )}
            </Box>
          );
        })}
      </Box>
      {activeSession ? (
        <Box width="100%" marginTop={1}>
          <TranscriptPanel
            activeSession={activeSession}
            transcript={transcript}
            pendingStage={pendingStage}
            pendingQuestion={pendingQuestion}
            spinnerFrame={spinnerFrame}
            width={80}
            maxLines={MAX_TRANSCRIPT_LINES}
            scrollOffset={activeScrollOffset}
          />
        </Box>
      ) : (
        <Text color="gray">Selecione um card e pressione Enter para abrir o painel do agente.</Text>
      )}
    </Box>
  );
};

type SessionsViewProps = {
  sessions: SessionRecord[];
  activeSession: SessionRecord | null;
  transcript: TranscriptEntry[];
  pendingStage: string | null;
  pendingQuestion: PendingQuestion | null;
  width: number;
  spinnerFrame: number;
  scrollOffsets: Record<string, number>;
};

const SessionsView = ({
  sessions,
  activeSession,
  transcript,
  pendingStage,
  pendingQuestion,
  width,
  spinnerFrame,
  scrollOffsets,
}: SessionsViewProps) => {
  if (!sessions || sessions.length === 0) return <Text>Nenhuma sessão encontrada. Use a aba Agents.</Text>;

  const transcriptWidth = Math.max(40, width - 24);
  const activeScrollOffset = activeSession ? scrollOffsets[activeSession.id] ?? 0 : 0;

  return (
    <Box flexDirection="row" width={width}>
      <Box width={24} flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} flexShrink={0}>
        <Text color="cyan">Sessões</Text>
        {sessions.map(session => (
          <Box key={session.id} flexDirection="column" marginBottom={1}>
            <Text color={activeSession?.id === session.id ? 'magenta' : 'white'}>
              {activeSession?.id === session.id ? '➤ ' : '  '}
              {session.agentName}
            </Text>
            <Text color="gray">{session.workflow}</Text>
            <Text color={colorForStatus(session.status)}>Status: {session.status}</Text>
          </Box>
        ))}
      </Box>
      <Box flexGrow={1} paddingLeft={1} flexDirection="column" width="100%">
        <TranscriptPanel
          activeSession={activeSession}
          transcript={transcript}
          pendingStage={pendingStage}
          pendingQuestion={pendingQuestion}
          width={transcriptWidth}
          spinnerFrame={spinnerFrame}
          maxLines={MAX_TRANSCRIPT_LINES}
          scrollOffset={activeScrollOffset}
        />
      </Box>
    </Box>
  );
};

type TranscriptPanelProps = {
  activeSession: SessionRecord | null;
  transcript: TranscriptEntry[];
  pendingStage: string | null;
  pendingQuestion: PendingQuestion | null;
  width?: number;
  spinnerFrame: number;
  maxLines?: number;
  scrollOffset?: number;
};

const TranscriptPanel = ({
  activeSession,
  transcript,
  pendingStage,
  pendingQuestion,
  width = 80,
  spinnerFrame,
  maxLines = MAX_TRANSCRIPT_LINES,
  scrollOffset = 0,
}: TranscriptPanelProps) => {
  if (!activeSession) return <Text>Nenhuma sessão ativa ainda.</Text>;

  const renderedLines = useMemo(() => {
    return transcript.flatMap(entry =>
      wrapText(entry.text, width).split('\n').map(line => ({ line, color: colorForEntry(entry.kind) }))
    );
  }, [transcript, width]);
  const limit = Math.max(1, maxLines);
  const totalLines = renderedLines.length;
  const maxOffset = Math.max(0, totalLines - limit);
  const clampedOffset = Math.min(Math.max(scrollOffset, 0), maxOffset);
  const start = Math.max(0, totalLines - limit - clampedOffset);
  const visibleLines = renderedLines.slice(start, start + limit);
  const hasOlder = start > 0;
  const hasNewer = start + visibleLines.length < totalLines;

  return (
    <Box width="100%" flexDirection="column" borderStyle="round" borderColor="magenta" padding={1}>
      <Text color="magenta">
        {activeSession.agentName} • {activeSession.workflow}
      </Text>
      {pendingStage && (
        <Text color="yellow">
          {spinnerChars[spinnerFrame]} {pendingStage}
        </Text>
      )}
      <Box flexDirection="column" marginTop={1}>
        {transcript.length === 0 && <Text color="gray">Sem mensagens ainda.</Text>}
        {hasOlder && <Text dimColor>▲ Conteúdo anterior (PgUp para rolar)</Text>}
        {visibleLines.map((line, index) => (
          <Text key={`line-${index}`} color={line.color}>
            {line.line}
          </Text>
        ))}
        {hasNewer && <Text dimColor>▼ Mais mensagens abaixo (PgDn)</Text>}
        {pendingQuestion && pendingQuestion.sessionId === activeSession.id && (
          <Box flexDirection="column" marginTop={1}>
            {wrapText(pendingQuestion.prompt, width)
              .split('\n')
              .map((line, idx) => (
                <Text key={`prompt-${idx}`} color="cyan">
                  {idx === 0 ? `Pergunta: ${line}` : line}
                </Text>
              ))}
            {wrapText(pendingQuestion.answer || '...', width)
              .split('\n')
              .map((line, idx) => (
                <Text key={`answer-${idx}`}>{idx === 0 ? `Resposta: ${line}` : line}</Text>
              ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

const LogsView = () => (
  <Box flexDirection="column">
    <Text>Logs recentes</Text>
    <Box marginTop={1} flexDirection="column">
      {mockLogs.map((log, index) => (
        <React.Fragment key={index}>
          {wrapText(log, 80)
            .split('\n')
            .map((line, idx) => (
              <Text key={`${index}-${idx}`} color="gray">
                {line}
              </Text>
            ))}
        </React.Fragment>
      ))}
    </Box>
  </Box>
);

type HomeViewProps = {
  catalogLoaded: boolean;
  steps: GuidedState[];
  cursor: number;
  focusTarget: 'menu' | 'content';
};

const HomeView = ({catalogLoaded, steps, cursor, focusTarget}: HomeViewProps) => (
  <Box flexDirection="column">
    <Text color="magenta">BMAD Orchestrator</Text>
    <Text>
      Inicie um projeto do zero passando por cada fase recomendada: análise → planejamento → arquitetura → execução → QA → documentação.
    </Text>
    <Text color={catalogLoaded ? 'green' : 'yellow'}>
      Catálogo {catalogLoaded ? 'pronto' : 'carregando...'} — escolha a próxima etapa com ↑/↓ e Enter.
    </Text>
    <Box marginTop={1} flexDirection="column">
      {steps.map((state, index) => {
        const isSelected = focusTarget === 'content' && index === cursor;
        const color = isSelected ? 'magenta' : state.status === 'locked' ? 'gray' : 'white';
        return (
          <React.Fragment key={`${state.step.id}-${index}`}>
            <Text color={color}>
              {guidedStatusSymbol(state.status)} {index + 1}. {state.step.label} — {state.agentName}
            </Text>
            <Text color="gray">
              {state.step.description}
              {state.status === 'locked' && ' (aguarde etapa anterior)'}
            </Text>
            <Text color="gray">Status: {guidedStatusLabel(state.status)}</Text>
            <Text> </Text>
          </React.Fragment>
        );
      })}
    </Box>
  </Box>
);

function colorForStatus(status: SessionRecord['status']): string {
  switch (status) {
    case 'done':
      return 'green';
    case 'in-progress':
      return 'yellow';
    case 'error':
      return 'red';
    default:
      return 'gray';
  }
}

function colorForEntry(kind: TranscriptKind): string {
  switch (kind) {
    case 'question':
      return 'cyan';
    case 'answer':
      return 'white';
    case 'error':
      return 'red';
    case 'artifact':
      return 'green';
    case 'system':
      return 'yellow';
    default:
      return 'gray';
  }
}

function describeSessionStatus(status: SessionRecord['status']): string {
  switch (status) {
    case 'drafted':
      return 'rascunho';
    case 'ready':
      return 'ready-for-dev';
    case 'in-progress':
      return 'em execução';
    case 'review':
      return 'em revisão';
    case 'done':
      return 'concluída';
    case 'error':
      return 'erro';
    default:
      return status;
  }
}

function guidedStatusSymbol(status: GuidedStepStatus): string {
  switch (status) {
    case 'done':
      return '•';
    case 'in-progress':
      return '•';
    case 'ready':
      return '•';
    case 'locked':
    default:
      return '·';
  }
}

function guidedStatusLabel(status: GuidedStepStatus): string {
  switch (status) {
    case 'done':
      return 'Concluído';
    case 'in-progress':
      return 'Em andamento';
    case 'ready':
      return 'Pronto para iniciar';
    case 'locked':
    default:
      return 'Aguardando etapa anterior';
  }
}

function wrapText(text: string, width: number): string {
  return text
    .split('\n')
    .map(line => wrapLine(line, width))
    .join('\n');
}

function wrapLine(line: string, width: number): string {
  if (line.length <= width) return line;
  const words = line.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (word.length > width) {
      if (current.length > 0) {
        lines.push(current);
        current = '';
      }
      const chunks = word.match(new RegExp(`.{1,${width}}`, 'g')) ?? [word];
      lines.push(...chunks.slice(0, -1));
      current = chunks[chunks.length - 1];
      continue;
    }
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (candidate.length > width) {
      if (current.length > 0) lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines.join('\n');
}

function describeStage(stage?: string | null): string {
  if (!stage) return 'Processando';
  const normalized = stage.toLowerCase();
  switch (normalized) {
    case 'llm':
      return 'Consultando modelo local e gerando plano';
    case 'files':
    case 'artifact':
      return 'Criando artefatos e documentação';
    case 'review':
      return 'Validando entregáveis';
    case 'inputs':
      return 'Coletando inputs';
    default:
      return `Executando etapa ${stage}`;
  }
}

function stageMessage(stage?: string | null): string {
  const base = describeStage(stage);
  return `${base}...`;
}

function describeStep(stepType?: string, step?: Record<string, unknown>): string {
  const asAny = step as Record<string, any> | undefined;
  const text = typeof asAny?.text === 'string' ? asAny.text : asAny?.prompt;
  switch (stepType) {
    case 'tool': {
      const name = typeof asAny?.name === 'string' ? asAny.name : 'ferramenta';
      return `→ Executando ${name}: ${JSON.stringify(asAny?.params ?? {})}`;
    }
    case 'handoff':
      return `→ Preparando handoff para ${asAny?.target ?? 'outro agente'}`;
    case 'question':
      return `→ Coletando input adicional: ${text ?? ''}`;
    default:
      return text ? `→ ${text}` : '→ Executando passo do workflow';
  }
}

function formatArtifactEntry(artifact: { path: string; description?: string; preview?: string }) {
  const base = `Artefato pronto: ${artifact.path}${artifact.description ? ` — ${artifact.description}` : ''}`;
  if (!artifact.preview) return base;
  return `${base}\nResumo: ${artifact.preview}`;
}

function truncate(text: string, size: number): string {
  if (text.length <= size) return text;
  return `${text.slice(0, size - 1)}...`;
}
