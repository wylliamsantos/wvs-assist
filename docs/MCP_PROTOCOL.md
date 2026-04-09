# Protocolo MCP Interno

## Stack Sugerido
- **Backend**: Bun + Elysia (ou Fastify) servindo HTTP/WebSocket.
- **Transporte MCP**: WebSocket com JSON Lines (compatível com StreamableHTTP da Anthropic).
- **Auth**: JWT corporativo curto (15 min) emitido via `/auth/device`.

## Handshake
1. Cliente chama `POST /auth/device` com credenciais SSO -> recebe `{accessToken, refreshToken, expiresAt}`.
2. Cliente abre `WS /mcp` com headers `Authorization: Bearer <accessToken>` e `x-client-version`.
3. Servidor responde com `mcp.welcome` contendo:
   ```json
   {
     "type": "mcp.welcome",
     "server": "bmad",
     "version": "0.1.0",
     "tools": ["load_agent", "run_workflow", "list_skills"],
     "capabilities": {"streaming": true}
   }
   ```

## Mensagens
- **Solicitar catálogo**
  ```json
  {"id":"req-1","type":"catalog.list","payload":{"persona": "product_architect"}}
  ```
- **Responder catálogo**
  ```json
  {"id":"req-1","type":"catalog.list.ok","payload":{"agents":[...]}}
  ```
- **Executar workflow**
  ```json
  {
    "id":"wf-42",
    "type":"workflow.run",
    "payload":{
      "workflowId":"plan.feature",
      "context":{ "repo":"git@...","branch":"feature/bmad" }
    }
  }
  ```
- **Eventos streaming**: `workflow.event` (stdout, logs, tool-calls) até `workflow.complete`.
- **Erros**: `*.error` com `code`, `message`, `retryable`.

## Catálogo e Flags
- `GET /catalog/agents`: retorna personas, skills, workflows.
- `GET /flags`: feature flags por tenant.

## Observabilidade
- `POST /telemetry/run`, `/telemetry/step`, `/telemetry/request` replicando estrutura do nt-beat.

## TODO
- Formalizar schemas JSON (zod/io-ts) e geradores de tipos.
- Definir política de renovação de tokens via `POST /auth/refresh`.
- Adicionar suporte a anexos (uploads) se workflows precisarem.
