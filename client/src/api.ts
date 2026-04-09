import { useCallback, useEffect, useRef, useState } from "react";
import { loadState, saveState, StoredTokens } from "./storage";

const DEFAULT_API_BASE = "http://localhost:4000";
const ENV_API_BASE = process.env.BMAD_API_URL;

export type AgentCatalog = {
  agents: { id: string; displayName: string; workflows: string[] }[];
};

export type WorkflowSummary = {
  id: string;
  persona: string;
  personaName: string;
  phase: string;
  summary: string;
  inputs: { key: string; description: string }[];
  outputs: { path: string; description: string }[];
};

export type UseCatalogState = {
  catalog: AgentCatalog | null;
  loading: boolean;
  error: string | null;
  tokens: StoredTokens | null;
  apiBase: string;
};

export function useCatalog(): UseCatalogState {
  const [catalog, setCatalog] = useState<AgentCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<StoredTokens | null>(null);
  const [apiBase, setApiBase] = useState<string>(ENV_API_BASE || DEFAULT_API_BASE);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);

      try {
        const resolvedBase = await resolveApiBase();
        if (cancelled) return;
        setApiBase(resolvedBase);

        const authedTokens = await ensureTokens(resolvedBase);
        if (cancelled) return;
        setTokens(authedTokens);

        const catalogRes = await fetch(`${resolvedBase}/catalog/agents`);
        if (!catalogRes.ok) throw new Error(`catalog ${catalogRes.status}`);
        const data = (await catalogRes.json()) as AgentCatalog;
        if (cancelled) return;
        setCatalog(data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog, loading, error, tokens, apiBase };
}

export function useWorkflows(apiBase: string | null) {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiBase) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/workflows`);
        if (!res.ok) throw new Error(`workflows ${res.status}`);
        const data = (await res.json()) as { workflows: WorkflowSummary[] };
        if (!cancelled) setWorkflows(data.workflows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  return { workflows, loading, error };
}

export function useMcpConnection(tokens: StoredTokens | null, apiBase: string) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<string[]>([]);

  useEffect(() => {
    if (!tokens || !apiBase) return;

    let ws: WebSocket | null = null;
    let closed = false;

    const wsUrl = new URL("/mcp", apiBase);
    wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
    wsUrl.searchParams.set("access_token", tokens.accessToken);

    setStatus("connecting");
    setError(null);

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      queueRef.current = [];
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
      return;
    }

    ws.addEventListener("open", () => {
      if (closed) return;
      setStatus("connected");
      while (queueRef.current.length > 0) {
        const pending = queueRef.current.shift();
        if (pending) ws?.send(pending);
      }
    });

    ws.addEventListener("message", (event) => {
      if (closed) return;
      const message = typeof event.data === "string" ? event.data : event.data.toString();
      setLastMessage(message);
      try {
        setLastEvent(JSON.parse(message));
      } catch {
        setLastEvent(null);
      }
    });

    ws.addEventListener("close", () => {
      if (closed) return;
      setStatus("idle");
    });

    ws.addEventListener("error", (event) => {
      if (closed) return;
      setStatus("error");
      const anyEvent = event as { message?: string };
      setError(anyEvent?.message || "ws error");
    });

    return () => {
      closed = true;
      wsRef.current = null;
      ws?.close();
    };
  }, [tokens, apiBase]);

  const send = useCallback((payload: unknown) => {
    const serialized = JSON.stringify(payload);
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(serialized);
      return true;
    }
    queueRef.current.push(serialized);
    return false;
  }, []);

  return { status, lastMessage, lastEvent, error, send };
}

async function resolveApiBase(): Promise<string> {
  const saved = await loadState();
  const resolved = ENV_API_BASE || saved?.apiBase || DEFAULT_API_BASE;
  if (!saved || saved.apiBase !== resolved) await saveState({ apiBase: resolved });
  return resolved;
}

async function ensureTokens(apiBase: string): Promise<StoredTokens> {
  const state = await loadState();
  if (state?.tokens && state.tokens.expiresAt > Date.now() + 5000) {
    return state.tokens;
  }

  const tokensRes = await fetch(`${apiBase}/auth/device`, { method: "POST" });
  if (!tokensRes.ok) throw new Error(`auth/device ${tokensRes.status}`);
  const tokens = (await tokensRes.json()) as StoredTokens;
  await saveState({ apiBase, tokens });
  return tokens;
}
