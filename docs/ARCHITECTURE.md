# Arquitetura BMAD Internal Agent Platform

## Visão Geral
- **Client (Bun + TUI)**: CLI interativo com registro de ferramentas locais e integração MCP.
- **MCP Backend**: serviço remoting que entrega agentes, skills e workflows e conecta com provedores LLM.
- **Observabilidade/Security**: pipeline de logs, tracing e storage seguro de tokens.

## Fluxo de Dados
1. Usuário autentica no cliente -> tokens gravados em storage XDG.
2. Cliente conecta no MCP interno, solicita catálogo de agentes/workflows conforme perfil BMAD.
3. Execuções de ferramentas locais e remotas são telemetradas e enviadas ao backend.
4. Backend consulta provedores (LLMs, RAG, Git, etc.) e retorna respostas para o TUI.

## Próximos Passos Arquiteturais
- Definir contratos MCP (mensagens, erros, handshake).
- Modelar storage local (tokens, logs, cache).
- Selecionar stack do backend (ex.: Node/Bun + WebSocket + Postgres).
