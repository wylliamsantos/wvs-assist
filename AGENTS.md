# Repository Guidelines

## Project Structure & Module Organization
- `client/`: Ink-based TUI (Bun + React) that fetches the agent catalog, drives workflows, and renders transcripts. Entry point: `src/index.tsx`.
- `server/`: Bun HTTP/WebSocket stub exposing `/auth/device`, `/catalog`, `/workflows`, and `/mcp`. Workflow artifacts are mirrored under `server/data/artifacts/` and workspace paths such as `docs/`.
- `docs/`: Roadmaps, playbook format references, and generated artifacts (e.g., `PRD.md`, `epics.md`).
- `AGENTS.md`, `README.md`: contributor-facing documentation.

## Build, Test, and Development Commands
- Install deps (if needed): `~/.bun/bin/bun install` inside each package.
- Run backend stub: `OLLAMA_MODEL=qwen3.5:9b OLLAMA_URL=http://127.0.0.1:11434 ~/.bun/bin/bun --cwd server run src/server.ts`.
- Launch TUI client: `BMAD_API_URL=http://localhost:4000 ~/.bun/bin/bun --cwd client run src/index.tsx`.
- No automated tests yet; treat `bun test` targets as TODOs when adding coverage.
- Keyboard cheatsheet: navegue apenas pelo teclado — `↑/↓` e `←/→` movem os cards/workflows, `Enter` inicia sessão, `PgUp/PgDn` rolam o painel magenta.

## Coding Style & Naming Conventions
- TypeScript/TSX, 2-space indentation, ASCII comments unless domain terms require accents.
- Prefer functional React components and hooks; keep Ink components pure.
- Use descriptive snake-case IDs for workflows (`planning.create-prd`) and kebab-case session IDs (`ses-<timestamp>`).
- Follow existing comment style: concise, “why” over “what.”

## Testing Guidelines
- Future tests should live under `client/src/__tests__/` and `server/src/__tests__/` using Bun’s test runner.
- Name files `<module>.test.ts` and focus on catalog hooks, MCP handlers, and artifact writers.
- Manual smoke test: start server + client, run a workflow, confirm `docs/*.md` outputs and TUI transcript updates.

## Commit & Pull Request Guidelines
- Commit messages follow short imperative summaries (“Add MCP spinner feedback”). Group related file changes per commit.
- PRs should include: purpose summary, test evidence (commands + outcomes), and any screenshots of the TUI when UI changes apply.
- Reference roadmap items or issues in the description (e.g., “Closes #12”).

## Agent & Workflow Tips
- TUI renderiza agentes como cards; mantenha descrições e nomes de workflow curtos (snake_case) para caber no layout.
- Cada `workflow.artifact` gera um resumo + “Próximos Passos”. Escreva `outputs` de playbooks e descrições pensando nessa mensagem.
- Keep `server/data/playbooks/*.yaml` synchronized com `docs/`; JSON é aceito mas prefira YAML canônico quando editar.
- When adding new outputs, garanta que `writeWorkspaceArtifact` resolva o path (sempre relativo ao repo) para expor os arquivos em `docs/`.
