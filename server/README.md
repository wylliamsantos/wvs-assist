# BMAD MCP Backend

- Autenticação corporativa (JWT/SSO).
- Endpoints principais: `/auth`, `/mcp`, `/catalog`, `/flags`.
- Conecta com provedores LLM e sistemas internos (Git, Jira, etc.).

## TODO
- Escolher framework (ex.: NestJS, Fastify, Bun).
- Definir esquemas de dados para agentes/skills/workflows.
- Configurar storage (Postgres/Redis) para catálogo e sessões.
