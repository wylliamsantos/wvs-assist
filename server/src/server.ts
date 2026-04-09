#!/usr/bin/env bun
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ServerWebSocket } from "bun";

const PORT = Number(process.env.PORT || 4000);
const AI_PROVIDER = (process.env.AI_PROVIDER || "ollama") as "ollama" | "codex";
const AI_FALLBACK_PROVIDER = (process.env.AI_FALLBACK_PROVIDER || "") as "" | "ollama" | "codex";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const TOKENS = {
  accessToken: "demo-access-token",
  refreshToken: "demo-refresh-token",
  expiresAt: Date.now() + 15 * 60 * 1000
};

type PlaybookStep =
  | { type: "instruction"; text: string }
  | { type: "question"; prompt: string }
  | { type: "tool"; name: string; params?: Record<string, unknown> }
  | { type: "handoff"; target: string; text: string }
  | { type: string; text?: string; [key: string]: unknown };

type Playbook = {
  id: string;
  persona: string;
  phase: string;
  summary: string;
  inputs: { key: string; description: string }[];
  steps: PlaybookStep[];
  outputs: { path: string; description: string }[];
  checks: { type: string; condition: string }[];
};

type AgentSummary = {
  id: string;
  displayName: string;
  role?: string;
  phase?: string;
  description?: string;
  workflows: string[];
};

type WorkflowSummary = {
  id: string;
  persona: string;
  personaName: string;
  phase: string;
  summary: string;
  inputs: { key: string; description: string }[];
  outputs: { path: string; description: string }[];
};

type ArtifactRecord = { path: string; description: string; preview?: string };

type SessionStatus = 'backlog' | 'drafted' | 'ready' | 'in-progress' | 'review' | 'done' | 'error';
type RunMode = 'guided' | 'expert';
type SessionRecord = {
  id: string;
  agentId: string;
  agentName: string;
  workflow: string;
  phase: string;
  runMode: RunMode;
  status: SessionStatus;
  importedFrom?: string[];
  startedAt: string;
  updatedAt: string;
};

type QuestionWaiter = {
  resolve: (answer: string) => void;
  timeout: ReturnType<typeof setTimeout>;
  ws: ServerWebSocket<any>;
};

const PERSONA_DETAILS: Record<string, { displayName: string; role: string; phase: string; description: string }> = {
  "mary-analyst": {
    displayName: "Mary — Business Analyst",
    role: "Strategic Business Analyst",
    phase: "analysis",
    description: "Pesquisa de mercado, elicitação de requisitos e síntese clara."
  },
  "john-pm": {
    displayName: "John — Product Manager",
    role: "Investigative Product Strategist",
    phase: "planning",
    description: "Transforma insights em PRDs e backlog executável."
  },
  "sally-ux": {
    displayName: "Sally — UX Designer",
    role: "User Experience Designer",
    phase: "planning",
    description: "Conduz design centrado no usuário e validações."
  },
  "winston-architect": {
    displayName: "Winston — System Architect",
    role: "System Architect",
    phase: "solutioning",
    description: "Define arquiteturas escaláveis e mitiga riscos técnicos."
  },
  "bob-scrum": {
    displayName: "Bob — Scrum Master",
    role: "Technical Scrum Master",
    phase: "implementation",
    description: "Garante sprints eficientes com handoffs claros."
  },
  "amelia-dev": {
    displayName: "Amelia — Developer",
    role: "Senior Implementation Engineer",
    phase: "implementation",
    description: "Entrega stories com aderência estrita ao DoD."
  },
  "murat-qa": {
    displayName: "Murat — Master Test Architect",
    role: "Master Test Architect",
    phase: "testing",
    description: "Orquestra estratégia de QA e quality gates."
  },
  "paige-writer": {
    displayName: "Paige — Technical Writer",
    role: "Technical Documentation Specialist",
    phase: "documentation",
    description: "Cria documentação acessível e versões auditáveis."
  }
};

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PLAYBOOK_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/playbooks");
const ARTIFACTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/artifacts");
const SESSIONS_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/sessions.json");
const OUTPUT_CHUNK_SIZE = 160;
const playbooks = loadPlaybooks(PLAYBOOK_DIR);
const catalog = buildCatalog(playbooks);
const workflowIndex = buildWorkflowIndex(playbooks);
const sessionsStore = loadSessionsStore();
const questionWaiters = new Map<string, QuestionWaiter>();

const PHASE_ORDER = ['analysis', 'planning', 'solutioning', 'implementation', 'testing', 'documentation'] as const;

const FALLBACK_FOLLOWUPS: Record<string, string[]> = {
  'analysis.problem-tree': [
    'Quais stakeholders ou equipes são mais impactados hoje?',
    'Existem métricas ou prazos que já foram definidos para validar o sucesso?',
    'Qual risco ou dependência externa mais preocupa nesse contexto?'
  ],
  'planning.create-prd': [
    'Há alguma suposição crítica que precise ser validada antes do build?',
    'Quais restrições de escopo e orçamento não podemos ultrapassar?'
  ]
};

const server = Bun.serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/auth/device" && req.method === "POST") {
      return Response.json(TOKENS);
    }

    if (url.pathname === "/catalog/agents" && req.method === "GET") {
      return Response.json(catalog);
    }

    if (url.pathname === "/catalog/playbooks" && req.method === "GET") {
      return Response.json({ playbooks });
    }

    if (url.pathname === "/workflows" && req.method === "GET") {
      return Response.json({ workflows: workflowIndex.summaries });
    }
    if (url.pathname === "/sessions" && req.method === "GET") {
      return Response.json({ sessions: listSessions() });
    }

    if (url.pathname === "/sessions/import-expert" && req.method === "POST") {
      try {
        const body = (await req.json()) as { sourceSessionId?: string; targetSessionId?: string };
        const result = importExpertEvidence(body.sourceSessionId ?? "", body.targetSessionId ?? "");
        return Response.json(result);
      } catch (err) {
        return Response.json(
          { ok: false, error: err instanceof Error ? err.message : String(err) },
          { status: 400 }
        );
      }
    }

    if (url.pathname.startsWith("/workflows/") && req.method === "GET") {
      const id = decodeURIComponent(url.pathname.replace("/workflows/", ""));
      const playbook = workflowIndex.byId.get(id);
      if (!playbook) return new Response("Not Found", { status: 404 });
      return Response.json({ workflow: playbook });
    }

    if (url.pathname === "/mcp" && server.upgrade(req)) {
      return new Response(null);
    }

    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    open(ws) {
      ws.send(
        JSON.stringify({
          type: "mcp.welcome",
          server: "bmad-stub",
          version: "0.1.0",
          tools: ["load_agent", "run_workflow"],
          capabilities: { streaming: true }
        })
      );
    },
    close(ws) {
      for (const [questionId, waiter] of questionWaiters.entries()) {
        if (waiter.ws === ws) {
          clearTimeout(waiter.timeout);
          questionWaiters.delete(questionId);
        }
      }
    },
    message(ws, message) {
      try {
        const payload = typeof message === "string" ? JSON.parse(message) : null;
        if (!payload) throw new Error("invalid_payload");

        if (payload.type === "catalog.list") {
          ws.send(JSON.stringify({ id: payload.id, type: "catalog.list.ok", payload: catalog }));
          return;
        }

        if (payload.type === "playbook.get") {
          const pb = workflowIndex.byId.get(payload.id);
          ws.send(
            JSON.stringify(
              pb
                ? { id: payload.id, type: "playbook.get.ok", payload: pb }
                : { id: payload.id, type: "playbook.get.error", error: "not_found" }
            )
          );
          return;
        }

        if (payload.type === "workflow.list") {
          ws.send(
            JSON.stringify({
              id: payload.id,
              type: "workflow.list.ok",
              payload: workflowIndex.summaries
            })
          );
          return;
        }

        if (payload.type === "workflow.get") {
          const pb = workflowIndex.byId.get(payload.workflowId ?? payload.id);
          ws.send(
            JSON.stringify(
              pb
                ? { id: payload.id, type: "workflow.get.ok", payload: pb }
                : { id: payload.id, type: "workflow.get.error", error: "not_found" }
            )
          );
          return;
        }

        if (payload.type === "workflow.run") {
          void handleWorkflowRun(ws, payload);
          return;
        }

        if (payload.type === "workflow.import_expert") {
          try {
            const result = importExpertEvidence(payload.sourceSessionId ?? "", payload.targetSessionId ?? "");
            ws.send(JSON.stringify({ id: payload.id, type: "workflow.import_expert.ok", payload: result }));
          } catch (err) {
            ws.send(
              JSON.stringify({
                id: payload.id,
                type: "workflow.import_expert.error",
                error: err instanceof Error ? err.message : String(err)
              })
            );
          }
          return;
        }

        if (payload.type === "workflow.answer" && payload.questionId) {
          const waiter = questionWaiters.get(payload.questionId);
          if (!waiter) {
            ws.send(
              JSON.stringify({
                id: payload.id,
                type: "workflow.answer.error",
                error: "unknown_question",
                questionId: payload.questionId
              })
            );
            return;
          }
          if (waiter.ws !== ws) {
            ws.send(
              JSON.stringify({
                id: payload.id,
                type: "workflow.answer.error",
                error: "invalid_session",
                questionId: payload.questionId
              })
            );
            return;
          }
          clearTimeout(waiter.timeout);
          questionWaiters.delete(payload.questionId);
          waiter.resolve(String(payload.answer ?? ""));
          return;
        }
      } catch (err) {
        console.error("mcp message error", err);
      }

      ws.send(JSON.stringify({ type: "mcp.echo", data: message.toString() }));
    }
  }
});

console.log(`BMAD MCP stub listening on http://localhost:${PORT}`);

const MAX_ADAPTIVE_QUESTIONS = 3;

async function handleWorkflowRun(ws: ServerWebSocket<any>, payload: any) {
  const workflowId = payload.workflowId ?? payload.id;
  if (!workflowId) {
    ws.send(JSON.stringify({ id: payload?.id, type: "workflow.run.error", error: "missing_workflow_id" }));
    return;
  }

  const playbook = workflowIndex.byId.get(workflowId);
  if (!playbook) {
    ws.send(JSON.stringify({ id: payload?.id, type: "workflow.run.error", error: "workflow_not_found" }));
    return;
  }

  const runId = payload.id;
  const sessionId = payload.sessionId ?? runId;
  const runMode: RunMode = payload?.runMode === 'expert' ? 'expert' : 'guided';
  const gateCheck = validatePhaseGate(playbook.phase, runMode);
  if (!gateCheck.ok) {
    ws.send(
      JSON.stringify({
        id: runId,
        type: "workflow.run.error",
        workflowId,
        sessionId,
        error: gateCheck.reason,
        code: "phase_gate_failed"
      })
    );
    return;
  }

  recordSessionStart(sessionId, playbook, runMode);
  ws.send(JSON.stringify({ id: runId, type: "workflow.run.started", workflowId, sessionId, runMode }));

  const qnaContext: { prompt: string; answer: string }[] = [];

  try {
    for (const [index, step] of playbook.steps.entries()) {
      if (step.type === "question") {
        const questionId = `${runId}:q:${index}`;
        ws.send(
          JSON.stringify({
            id: runId,
            type: "workflow.question",
            workflowId,
            sessionId,
            questionId,
            prompt: step.prompt
          })
        );
        const answer = await waitForAnswer(questionId, ws);
        qnaContext.push({ prompt: step.prompt, answer });
        ws.send(
          JSON.stringify({
            id: runId,
            type: "workflow.answer",
            workflowId,
            sessionId,
            questionId,
            answer
          })
        );
        continue;
      }

      ws.send(
        JSON.stringify({
          id: runId,
          type: "workflow.step",
          workflowId,
          sessionId,
          stepIndex: index,
          stepType: step.type,
          step
        })
      );
    }

    await runAdaptiveQuestions(ws, {
      runId,
      workflowId,
      sessionId,
      playbook,
      qnaContext
    });

    ws.send(JSON.stringify({ id: runId, type: "workflow.run.pending", workflowId, sessionId, stage: "llm" }));
    const llmOutput = await runWorkflowLLM(playbook, payload?.input, qnaContext);
    const normalizedOutput = llmOutput?.trim() ?? "";
    const artifacts = writeArtifacts(sessionId, playbook, normalizedOutput, qnaContext, runMode);
    const primaryArtifact = artifacts.find((a) => a.description !== "Resumo do workflow") ?? artifacts[0];
    const displayOutput = buildWorkflowBrief(playbook, normalizedOutput, primaryArtifact);
    if (displayOutput.length > OUTPUT_CHUNK_SIZE) {
      for (const chunk of chunkText(displayOutput, OUTPUT_CHUNK_SIZE)) {
        ws.send(
          JSON.stringify({
            id: runId,
            type: "workflow.run.output.delta",
            workflowId,
            sessionId,
            chunk
          })
        );
      }
    }
    ws.send(
      JSON.stringify({
        id: runId,
        type: "workflow.run.output",
        workflowId,
        sessionId,
        output: displayOutput || "(sem saída textual)"
      })
    );
    for (const artifact of artifacts) {
      ws.send(
        JSON.stringify({
          id: runId,
          type: "workflow.artifact",
          workflowId,
          sessionId,
          artifact
        })
      );
    }

    ws.send(JSON.stringify({ id: runId, type: "workflow.run.completed", workflowId, sessionId }));
    updateSessionStatusRecord(sessionId, "done");
  } catch (err) {
    ws.send(
      JSON.stringify({
        id: runId,
        type: "workflow.run.error",
        workflowId,
        sessionId,
        error: err instanceof Error ? err.message : String(err)
      })
    );
    updateSessionStatusRecord(sessionId, "error");
  }
}

async function runAdaptiveQuestions(
  ws: ServerWebSocket<any>,
  {
    runId,
    workflowId,
    sessionId,
    playbook,
    qnaContext
  }: { runId: string; workflowId: string; sessionId: string; playbook: Playbook; qnaContext: { prompt: string; answer: string }[] }
) {
  const fallback = FALLBACK_FOLLOWUPS[playbook.id] ?? [];
  for (let index = 0; index < fallback.length; index++) {
    const prompt = fallback[index];
    const alreadyAsked = qnaContext.some((entry) => entry.prompt === prompt);
    if (alreadyAsked) continue;
    const asked = await askFollowupQuestion(ws, {
      runId,
      workflowId,
      sessionId,
      prompt,
      qnaContext,
      suffix: `fallback:${index}`
    });
    if (!asked) return;
  }

  for (let index = 0; index < MAX_ADAPTIVE_QUESTIONS; index++) {
    const followup = await generateFollowupQuestion(playbook, qnaContext);
    if (!followup?.ask || !followup.question) break;
    const asked = await askFollowupQuestion(ws, {
      runId,
      workflowId,
      sessionId,
      prompt: followup.question,
      qnaContext,
      suffix: `adaptive:${index}`
    });
    if (!asked || !followup.allowMore) break;
  }
}

async function askFollowupQuestion(
  ws: ServerWebSocket<any>,
  {
    runId,
    workflowId,
    sessionId,
    prompt,
    qnaContext,
    suffix
  }: {
    runId: string;
    workflowId: string;
    sessionId: string;
    prompt: string;
    qnaContext: { prompt: string; answer: string }[];
    suffix: string;
  }
) {
  const questionId = `${runId}:${suffix}`;
  ws.send(
    JSON.stringify({
      id: runId,
      type: "workflow.question",
      workflowId,
      sessionId,
      questionId,
      prompt
    })
  );
  try {
    const answer = await waitForAnswer(questionId, ws);
    qnaContext.push({ prompt, answer });
    ws.send(
      JSON.stringify({
        id: runId,
        type: "workflow.answer",
        workflowId,
        sessionId,
        questionId,
        answer
      })
    );
    return true;
  } catch (err) {
    if (err instanceof Error && err.message === "question_timeout") return false;
    throw err;
  }
}

async function generateFollowupQuestion(
  playbook: Playbook,
  qna: { prompt: string; answer: string }[]
): Promise<{ ask: boolean; question?: string; allowMore?: boolean } | null> {
  const persona = PERSONA_DETAILS[playbook.persona];
  const promptLines = [
    `Você é ${persona?.displayName ?? playbook.persona}, especialista em ${playbook.phase}.`,
    `Seu objetivo é identificar lacunas antes de finalizar o workflow ${playbook.id}.`,
    'Analise as perguntas e respostas já obtidas e retorne JSON no formato {"ask": true/false, "question": "texto", "allowMore": true/false}.',
    'Pergunte apenas se faltarem detalhes essenciais (metas, riscos, restrições, stakeholders, dependências).',
    'Se estiver satisfeito com o contexto atual, responda {"ask": false}.',
    '',
    'Histórico coletado:'
  ];
  if (qna.length === 0) {
    promptLines.push('(nenhuma resposta ainda)');
  } else {
    qna.forEach((item, idx) => {
      promptLines.push(`${idx + 1}. P: ${item.prompt}`);
      promptLines.push(`   R: ${item.answer}`);
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000 * 60);
  try {
    const response = await generateText(promptLines.join("\n"), {
      timeoutMs: 1000 * 60,
      signal: controller.signal
    });
    return parseFollowupResponse(response);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return null;
    console.warn("followup_question_error", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseFollowupResponse(raw: string) {
  const cleaned = raw.replace(/```json|```/gi, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return {
      ask: Boolean(parsed.ask),
      question: typeof parsed.question === "string" ? parsed.question.trim() : undefined,
      allowMore: parsed.allowMore !== false
    };
  } catch {
    // modelos locais podem devolver JSON imperfeito; tratar como sem follow-up
    return null;
  }
}

function waitForAnswer(questionId: string, ws: ServerWebSocket<any>) {
  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      questionWaiters.delete(questionId);
      reject(new Error("question_timeout"));
    }, 60_000);
    questionWaiters.set(questionId, { resolve, timeout, ws });
  });
}

async function runWorkflowLLM(playbook: Playbook, input?: string, qna?: { prompt: string; answer: string }[]) {
  const prompt = buildPrompt(playbook, input, qna);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000 * 60 * 2);

  try {
    return await generateText(prompt, {
      timeoutMs: 1000 * 60 * 2,
      signal: controller.signal
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw new Error("llm_timeout");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateText(prompt: string, options?: { timeoutMs?: number; signal?: AbortSignal }) {
  const primary = AI_PROVIDER;
  const fallback = AI_FALLBACK_PROVIDER && AI_FALLBACK_PROVIDER !== primary ? AI_FALLBACK_PROVIDER : null;

  try {
    return await runProviderGenerate(primary, prompt, options);
  } catch (err) {
    if (!fallback) throw err;
    console.warn(`provider '${primary}' failed, trying fallback '${fallback}'`, err);
    return await runProviderGenerate(fallback, prompt, options);
  }
}

async function runProviderGenerate(
  provider: "ollama" | "codex",
  prompt: string,
  options?: { timeoutMs?: number; signal?: AbortSignal }
) {
  if (provider === "codex") {
    return await generateWithCodex(prompt, options);
  }
  return await generateWithOllama(prompt, options);
}

async function generateWithOllama(prompt: string, options?: { timeoutMs?: number; signal?: AbortSignal }) {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
    signal: options?.signal
  });
  if (!res.ok) throw new Error(`ollama_${res.status}`);
  const data = (await res.json()) as { response?: string };
  return data.response ?? "";
}

async function generateWithCodex(prompt: string, options?: { timeoutMs?: number; signal?: AbortSignal }) {
  if (!OPENAI_API_KEY) {
    throw new Error("codex_missing_api_key");
  }
  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    }),
    signal: options?.signal
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`codex_${res.status}:${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

function loadPlaybooks(dir: string): Playbook[] {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
      .map((entry) => {
        const raw = readFileSync(path.join(dir, entry.name), "utf-8");
        return parseYamlDocument(raw);
      });
  } catch (err) {
    console.warn("Nenhum playbook carregado", err);
    return [];
  }
}

function buildCatalog(playbooks: Playbook[]): { agents: AgentSummary[] } {
  const map = new Map<string, AgentSummary>();
  for (const pb of playbooks) {
    const meta = PERSONA_DETAILS[pb.persona] ?? {
      displayName: pb.persona,
      role: "Agent",
      phase: pb.phase,
      description: pb.summary
    };
    const existing = map.get(pb.persona);
    if (existing) {
      existing.workflows.push(pb.id);
      continue;
    }
    map.set(pb.persona, {
      id: pb.persona,
      displayName: meta.displayName,
      role: meta.role,
      phase: meta.phase,
      description: meta.description,
      workflows: [pb.id]
    });
  }
  return { agents: Array.from(map.values()) };
}

function buildWorkflowIndex(playbooks: Playbook[]) {
  const summaries: WorkflowSummary[] = [];
  const byId = new Map<string, Playbook>();
  for (const pb of playbooks) {
    byId.set(pb.id, pb);
    const personaMeta = PERSONA_DETAILS[pb.persona];
    summaries.push({
      id: pb.id,
      persona: pb.persona,
      personaName: personaMeta?.displayName ?? pb.persona,
      phase: pb.phase,
      summary: pb.summary,
      inputs: pb.inputs,
      outputs: pb.outputs
    });
  }
  return { summaries, byId };
}

function buildPrompt(playbook: Playbook, input?: string, qna?: { prompt: string; answer: string }[]) {
  const persona = PERSONA_DETAILS[playbook.persona];
  const lines = [
    `Você é ${persona?.displayName ?? playbook.persona} atuando na fase ${playbook.phase}.`,
    `Workflow ${playbook.id}: ${playbook.summary}.`,
    "Inputs esperados:",
    ...playbook.inputs.map((inp) => `- ${inp.key}: ${inp.description}`),
    "Passos do playbook:",
    ...playbook.steps.map((step, idx) => `${idx + 1}. [${step.type}] ${"text" in step ? step.text : step.prompt ?? JSON.stringify(step)}`),
    "Outputs esperados:",
    ...playbook.outputs.map((out) => `- ${out.path}: ${out.description}`)
  ];
  if (input) {
    lines.push("Contexto adicional:", input);
  }
  if (qna && qna.length > 0) {
    lines.push("Respostas coletadas:");
    for (const item of qna) {
      lines.push(`Q: ${item.prompt}`);
      lines.push(`A: ${item.answer}`);
    }
  }
  lines.push("Produza um plano estruturado com ações concretas e artefatos sugeridos.");
  return lines.join("\n");
}

function buildWorkflowBrief(playbook: Playbook, output: string, artifact?: ArtifactRecord) {
  const resumen = buildPreview(output, 220);
  if (artifact) {
    return `Plano concluído por ${playbook.persona} e salvo em ${artifact.path} — ${artifact.description}. Principais notas: ${resumen}`;
  }
  return `Workflow ${playbook.id} finalizado: ${resumen}`;
}

function chunkText(text: string, size: number) {
  if (!text) return [];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks.length > 0 ? chunks : [text];
}

function writeArtifacts(
  sessionId: string,
  playbook: Playbook,
  output: string,
  qna?: { prompt: string; answer: string }[],
  runMode: RunMode = 'guided'
) {
  const baseDir = path.join(ARTIFACTS_DIR, sessionId);
  mkdirSync(baseDir, { recursive: true });
  const artifacts: ArtifactRecord[] = [];

  const summaryPath = path.join(baseDir, "summary.md");
  const qnaBlock = (qna || [])
    .map((item) => `### Pergunta\n${item.prompt}\n\n### Resposta\n${item.answer}\n`)
    .join("\n");
  const summaryContent = `# Resultado do Workflow ${playbook.id}\n\n${playbook.summary}\n\n## Plano Gerado\n${buildPreview(output, 280)}\n\n## Perguntas & Respostas\n${qnaBlock || "(Nenhuma pergunta registrada)"}\n`;
  writeFileSync(summaryPath, summaryContent, "utf-8");
  artifacts.push({
    path: path.relative(ARTIFACTS_DIR, summaryPath),
    description: "Resumo do workflow",
    preview: buildPreview(summaryContent)
  });

  for (const artifact of playbook.outputs) {
    const normalizedPath = normalizeArtifactOutputPath(artifact.path);
    const targetPath = path.join(baseDir, normalizedPath);
    mkdirSync(path.dirname(targetPath), { recursive: true });
    const content = composeArtifactContent({ ...artifact, path: normalizedPath }, playbook, output, runMode);
    writeFileSync(targetPath, content, "utf-8");
    artifacts.push({
      path: path.relative(ARTIFACTS_DIR, targetPath),
      description: artifact.description,
      preview: buildPreview(content)
    });
    writeWorkspaceArtifact(normalizedPath, content);
  }

  return artifacts;
}

function normalizeArtifactOutputPath(outputPath: string) {
  const trimmed = outputPath.trim();
  if (!trimmed) return 'docs/output.md';
  if (trimmed.endsWith('/')) return `${trimmed}README.md`;
  return trimmed;
}

function writeWorkspaceArtifact(relativePath: string, content: string) {
  const destination = resolveWorkspacePath(relativePath);
  if (!destination) return;
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, content, "utf-8");
}

function resolveWorkspacePath(relativePath: string) {
  if (!relativePath || path.isAbsolute(relativePath)) return null;
  const normalized = path.normalize(relativePath);
  if (normalized.startsWith("..")) return null;
  const absolute = path.resolve(ROOT_DIR, normalized);
  const rootPrefix = ROOT_DIR.endsWith(path.sep) ? ROOT_DIR : `${ROOT_DIR}${path.sep}`;
  if (!absolute.startsWith(rootPrefix)) return null;
  return absolute;
}

function buildPreview(content: string, max = 280) {
  const flat = content.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1)}…`;
}

function composeArtifactContent(
  artifact: { path: string; description: string },
  playbook: Playbook,
  output: string,
  runMode: RunMode
) {
  const nextSteps = '- Revisar com o time responsável e coletar comentários.\n' +
    '- Validar se os itens de "Inputs esperados" estão atualizados antes do próximo workflow.';

  const expertBlock = runMode === 'expert'
    ? `\n\n## Contexto de Consulta Especializada\n- Modo: expert (atalho)\n- Assumptions: o workflow pode ter sido executado sem todos os artefatos das fases anteriores.\n- Nível de confiança: médio (depende da completude do contexto informado).\n- Recomendação: importar este output para a jornada guided e validar nos gates oficiais.`
    : '';

  return `# ${artifact.description}\n\nGerado automaticamente pelo workflow ${playbook.id}.\n\n## Resumo do Resultado\n${output || '(sem texto do LLM)'}${expertBlock}\n\n## Próximos Passos\n${nextSteps}`;
}

function loadSessionsStore(): SessionRecord[] {
  try {
    const raw = readFileSync(SESSIONS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<SessionRecord>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((session) => ({
      id: String(session.id ?? ""),
      agentId: String(session.agentId ?? ""),
      agentName: String(session.agentName ?? ""),
      workflow: String(session.workflow ?? ""),
      phase: String(session.phase ?? inferPhaseFromWorkflow(String(session.workflow ?? "analysis.problem-tree"))),
      runMode: session.runMode === 'expert' ? 'expert' : 'guided',
      status: (session.status as SessionStatus) ?? 'drafted',
      importedFrom: Array.isArray(session.importedFrom) ? session.importedFrom.map(String) : [],
      startedAt: String(session.startedAt ?? new Date().toISOString()),
      updatedAt: String(session.updatedAt ?? new Date().toISOString())
    }));
  } catch (err) {
    // ignore missing/invalid file
  }
  return [];
}

function persistSessions() {
  mkdirSync(path.dirname(SESSIONS_FILE), { recursive: true });
  writeFileSync(SESSIONS_FILE, JSON.stringify(sessionsStore, null, 2), "utf-8");
}

function listSessions() {
  return [...sessionsStore].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function inferPhaseFromWorkflow(workflow: string): string {
  const prefix = workflow.split('.')[0];
  if (PHASE_ORDER.includes(prefix as (typeof PHASE_ORDER)[number])) return prefix;
  return 'analysis';
}

function validatePhaseGate(phase: string, runMode: RunMode): { ok: boolean; reason?: string } {
  if (runMode === 'expert') return { ok: true };
  const currentIndex = PHASE_ORDER.indexOf(phase as (typeof PHASE_ORDER)[number]);
  if (currentIndex <= 0) return { ok: true };

  const previousPhase = PHASE_ORDER[currentIndex - 1];
  const previousDone = sessionsStore.some((session) => session.phase === previousPhase && session.status === 'done');
  if (previousDone) return { ok: true };

  return {
    ok: false,
    reason: `Gate de fase não atendido: conclua ao menos um workflow da fase '${previousPhase}' antes de iniciar '${phase}' em modo guided.`
  };
}

function importExpertEvidence(sourceSessionId: string, targetSessionId: string) {
  const source = sessionsStore.find((session) => session.id === sourceSessionId);
  const target = sessionsStore.find((session) => session.id === targetSessionId);

  if (!source) throw new Error('source_session_not_found');
  if (!target) throw new Error('target_session_not_found');
  if (source.runMode !== 'expert') throw new Error('source_must_be_expert');
  if (target.runMode !== 'guided') throw new Error('target_must_be_guided');

  const imported = new Set(target.importedFrom ?? []);
  imported.add(source.id);
  target.importedFrom = Array.from(imported);
  target.updatedAt = new Date().toISOString();
  persistSessions();

  return {
    ok: true,
    sourceSessionId: source.id,
    targetSessionId: target.id,
    importedFrom: target.importedFrom
  };
}

function recordSessionStart(sessionId: string, playbook: Playbook, runMode: RunMode) {
  const now = new Date().toISOString();
  const meta = PERSONA_DETAILS[playbook.persona];
  const index = sessionsStore.findIndex((session) => session.id === sessionId);
  if (index >= 0) {
    sessionsStore[index] = {
      ...sessionsStore[index],
      status: 'in-progress',
      phase: playbook.phase,
      runMode,
      updatedAt: now
    };
  } else {
    sessionsStore.push({
      id: sessionId,
      agentId: playbook.persona,
      agentName: meta?.displayName ?? playbook.persona,
      workflow: playbook.id,
      phase: playbook.phase,
      runMode,
      status: 'in-progress',
      startedAt: now,
      updatedAt: now,
    });
  }
  persistSessions();
}

function updateSessionStatusRecord(sessionId: string, status: SessionStatus) {
  const index = sessionsStore.findIndex((session) => session.id === sessionId);
  if (index === -1) return;
  sessionsStore[index] = { ...sessionsStore[index], status, updatedAt: new Date().toISOString() };
  persistSessions();
}

function parseYamlDocument(raw: string) {
  const lines = raw.split(/\r?\n/);
  const [value] = parseNode(lines, 0, 0);
  return value as Playbook;
}

function parseNode(lines: string[], index: number, indent: number): [any, number] {
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim() || line.trim().startsWith('#')) {
      index++;
      continue;
    }
    const currentIndent = countIndent(line);
    if (currentIndent < indent) break;
    if (line.trim().startsWith('-')) {
      return parseSequence(lines, index, indent);
    }
    return parseMapping(lines, index, indent);
  }
  return [null, index];
}

function parseMapping(lines: string[], index: number, indent: number): [any, number] {
  const obj: Record<string, any> = {};
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim() || line.trim().startsWith('#')) {
      index++;
      continue;
    }
    const currentIndent = countIndent(line);
    if (currentIndent < indent) break;
    if (line.trim().startsWith('-') && currentIndent === indent) break;
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) throw new Error(`Invalid YAML line: ${line}`);
    const key = line.slice(0, colonIndex).trim();
    const rest = line.slice(colonIndex + 1).trim();
    if (!rest) {
      const [value, next] = parseNode(lines, index + 1, indent + 2);
      obj[key] = value;
      index = next;
    } else {
      obj[key] = parseScalar(rest);
      index++;
    }
  }
  return [obj, index];
}

function parseSequence(lines: string[], index: number, indent: number): [any[], number] {
  const arr: any[] = [];
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim() || line.trim().startsWith('#')) {
      index++;
      continue;
    }
    const currentIndent = countIndent(line);
    if (currentIndent < indent) break;
    if (!line.trim().startsWith('-')) break;
    const rest = line.trim().slice(1).trim();
    if (!rest) {
      const [value, next] = parseNode(lines, index + 1, indent + 2);
      arr.push(value);
      index = next;
    } else if (rest.includes(':')) {
      const colonIndex = rest.indexOf(':');
      const key = rest.slice(0, colonIndex).trim();
      const valuePart = rest.slice(colonIndex + 1).trim();
      arr.push({ [key]: parseScalar(valuePart) });
      index++;
    } else {
      arr.push(parseScalar(rest));
      index++;
    }
  }
  return [arr, index];
}

function countIndent(line: string) {
  let count = 0;
  while (count < line.length && line[count] === ' ') count++;
  return count;
}

function parseScalar(value: string) {
  if (!value) return '';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value === 'true' || value === 'false') return value === 'true';
  if (value === 'null') return null;
  if (!Number.isNaN(Number(value))) return Number(value);
  return value;
}
