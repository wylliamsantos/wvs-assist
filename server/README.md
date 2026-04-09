# BMAD MCP Backend

- Autenticação corporativa (JWT/SSO).
- Endpoints principais: `/auth`, `/mcp`, `/catalog`, `/flags`.
- Conecta com provedores LLM e sistemas internos (Git, Jira, etc.).

## Providers de IA (híbrido)
- `AI_PROVIDER=ollama|codex` (default: `ollama`)
- `AI_FALLBACK_PROVIDER=ollama|codex` (opcional)
- Ollama:
  - `OLLAMA_URL` (default `http://127.0.0.1:11434`)
  - `OLLAMA_MODEL` (default `llama3.2:3b`)
- Codex/OpenAI compatível:
  - `OPENAI_API_KEY`
  - `OPENAI_BASE_URL` (default `https://api.openai.com/v1`)
  - `OPENAI_MODEL` (default `gpt-4o-mini`)

## TODO
- Escolher framework (ex.: NestJS, Fastify, Bun).
- Definir esquemas de dados para agentes/skills/workflows.
- Configurar storage (Postgres/Redis) para catálogo e sessões.
