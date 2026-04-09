# Backlog Inicial

## Cliente CLI/TUI
- [ ] Definir stack UI (Ink + custom componentes).
- [ ] Implementar gestor de sessões e histórico.
- [ ] Portar registro de ferramentas locais (bash, glob, read, webfetch).
- [ ] Armazenar tokens/flags seguindo padrão XDG.
- [ ] Implementar logging local + rota de envio.

## Backend MCP
- [ ] Definir contratos gRPC/WebSocket para MCP.
- [ ] Implementar autenticação + emissão de tokens de curta duração.
- [ ] Construir catálogo de agentes/personas com workflows BMAD.
- [ ] Expor endpoints para flags, modelos, ferramentas remotas.

## BMAD Personas/Workflows
- [ ] Descrever personas (Product Architect, Dev, QA, SRE, Data) e suas skills.
- [ ] Criar playbooks BMAD (Ideate, Plan, Build, Measure, Analyze, Decide).
- [ ] Mapear integrações necessárias (Git, Jira, observabilidade, RAG).

## Observabilidade / Segurança
- [ ] Pipeline de logs (run/step/request) -> stack interno.
- [ ] Políticas de permissão/grants por ferramenta e diretório.
- [ ] Gestão de segredos (API keys LLM, tokens internos).
