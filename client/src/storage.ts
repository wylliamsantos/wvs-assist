import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DEFAULT_STATE_DIR = path.join(os.homedir(), ".local", "share", "bmad-client");
const STATE_DIR = process.env.BMAD_STATE_DIR || DEFAULT_STATE_DIR;
const STATE_FILE = path.join(STATE_DIR, "state.json");

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type RunMode = "guided" | "expert";

export type SessionRecord = {
  id: string;
  agentId: string;
  agentName: string;
  workflow: string;
  phase: string;
  runMode: RunMode;
  status: "backlog" | "drafted" | "ready" | "in-progress" | "review" | "done" | "error";
  startedAt: string;
  updatedAt: string;
};

export type ClientState = {
  apiBase?: string;
  tokens?: StoredTokens;
  sessions?: SessionRecord[];
};

async function ensureDir() {
  await mkdir(STATE_DIR, { recursive: true });
}

export async function loadState(): Promise<ClientState | null> {
  try {
    const raw = await readFile(STATE_FILE, "utf-8");
    return JSON.parse(raw) as ClientState;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function saveState(partial: Partial<ClientState>): Promise<ClientState> {
  const current = (await loadState()) ?? {};
  const next: ClientState = { ...current, ...partial };
  await ensureDir();
  await writeFile(STATE_FILE, JSON.stringify(next, null, 2), "utf-8");
  return next;
}

export async function updateSessions(mutator: (sessions: SessionRecord[]) => SessionRecord[]): Promise<SessionRecord[]> {
  const current = (await loadState()) ?? {};
  const sessions = current.sessions ?? [];
  const updated = mutator(sessions);
  await saveState({ ...current, sessions: updated });
  return updated;
}
