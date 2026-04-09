import { useCallback, useEffect, useState } from "react";
import type { SessionRecord } from "./storage";

type SessionsResponse = { sessions: SessionRecord[] };

export function useSessions(apiBase: string | null) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!apiBase) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/sessions`);
      if (!res.ok) throw new Error(`sessions ${res.status}`);
      const data = (await res.json()) as SessionsResponse;
      setSessions(data.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const refresh = useCallback(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const addSession = useCallback((session: SessionRecord) => {
    setSessions(prev => {
      if (prev.find(s => s.id === session.id)) return prev;
      return [...prev, session];
    });
  }, []);

  const updateSessionStatus = useCallback((id: string, status: SessionRecord["status"]) => {
    setSessions(prev =>
      prev.map(session => (session.id === id ? { ...session, status, updatedAt: new Date().toISOString() } : session))
    );
  }, []);

  return { sessions, loading, error, refresh, addSession, updateSessionStatus };
}
