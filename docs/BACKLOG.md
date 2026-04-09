# Backlog Inicial

## Orquestração Híbrida (Guided + Expert)
- [ ] Adicionar `runMode` em sessão (`guided` | `expert`) e persistência no backend.
- [ ] Implementar entrada no TUI para “Jornada Completa” vs “Consultar Especialista”.
- [ ] Permitir execução direta por especialidade (arquitetura, segurança, QA avançado, produto).
- [ ] Exibir assumptions e nível de confiança em saídas `expert`.
- [ ] Permitir importar resultado `expert` como evidência de fase em sessão `guided`.

## Gates, Estado e Validação
- [ ] Definir máquina de estados oficial da jornada (discovery → planning → solutioning → implementation → testing → documentation).
- [ ] Criar validador de gate por fase (inputs obrigatórios, outputs esperados, checks).
- [ ] Bloquear avanço sem gate aprovado e listar pendências com clareza.
- [ ] Registrar trilha de decisão e handoff entre agentes com contexto estruturado.

## Cliente CLI/TUI
- [ ] Definir stack UI (Ink + custom componentes).
- [ ] Implementar gestor de sessões e histórico.
- [ ] Portar registro de ferramentas locais (bash, glob, read, webfetch).
- [ ] Armazenar tokens/flags seguindo padrão XDG.
- [ ] Implementar logging local + rota de envio.
- [ ] Exibir progresso da jornada + “o que falta para avançar”.

## Backend MCP
- [ ] Definir contratos gRPC/WebSocket para MCP.
- [ ] Implementar autenticação + emissão de tokens de curta duração.
- [ ] Construir catálogo de agentes/personas com workflows BMAD.
- [ ] Expor endpoints para flags, modelos, ferramentas remotas.
- [ ] Versionar schema de playbook e validar YAML antes do run.

## BMAD Personas/Workflows
- [ ] Descrever personas (Product Architect, Dev, QA, SRE, Data) e suas skills.
- [ ] Criar playbooks BMAD (Ideate, Plan, Build, Measure, Analyze, Decide).
- [ ] Mapear integrações necessárias (Git, Jira, observabilidade, RAG).
- [ ] Padronizar artefatos mínimos por fase para suportar gate automático.

## Observabilidade / Segurança
- [ ] Pipeline de logs (run/step/request) -> stack interno.
- [ ] Políticas de permissão/grants por ferramenta e diretório.
- [ ] Gestão de segredos (API keys LLM, tokens internos).
