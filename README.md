# BMAD Internal Agent Platform

## Objetivo
Replicar a experiência do `nt-beat` com personas e workflows inspirados no método BMAD (Build More Architect Dreams), oferecendo um CLI/TUI corporativo com agentes especializados que cobrem ideação, planejamento, execução e operação.

## Componentes Principais
1. **Cliente Bun + TUI**
   - CLI/TUI em Bun com eventos (`session.*`, `agent.*`) e histórico persistente.
   - Registro local de ferramentas (bash, glob, read, webfetch, etc.) com política de permissões.
   - Observabilidade local (logs, tracing) e storage XDG (`~/.local/share/<app>`).
   - Configuração via `config.env` apontando para os serviços internos.
2. **Backend MCP Corporativo**
   - API autenticada (JWT/SSO) para listar agentes, skills e workflows.
   - Endpoint MCP (ex.: StreamableHTTP/WebSocket) que expõe ferramentas remotas (`load_agent_content`, `workflow_preflight`, etc.).
   - Catálogo de modelos/LLMs e distribuição de chaves gerenciadas.
   - Sistema de flags/remotas para rollout controlado.
3. **Catálogo de Personas/Workflows BMAD**
   - Playbooks por etapa (Ideate, Plan, Build, Measure, Analyze, Decide).
   - Definição de skills, permissões e ferramentas para cada persona (PM, Dev, QA, SRE, etc.).
   - Artefatos esperados (briefings, planos, PRs, relatórios) e templates reutilizáveis.
4. **Segurança e Observabilidade**
   - Armazenamento seguro de tokens, rotinas de reautenticação e revogação.
   - Telemetria detalhada (run/step/request logs) enviada ao stack interno.
   - Auditoria de permissões e histórico de execuções.

## Plano de Ataque
1. **Bootstrap do Cliente**
   - Reaproveitar o stack Bun e portar a TUI para um pacote interno.
   - Implementar camada de configuração (`config.env`) e storage XDG.
   - Definir conjunto mínimo de ferramentas locais + política de permissões.
2. **MCP Interno**
   - Projetar API para agentes/workflows/skills.
   - Publicar endpoint MCP que fala o mesmo protocolo do cliente.
   - Implementar autenticação corporativa e gestão de tokens.
   - Conectar LLMs locais (ex.: Ollama com Qwen) via `OLLAMA_URL`/`OLLAMA_MODEL` para executar workflows em modo privado.
3. **Modelagem BMAD**
   - Mapear etapas BMAD -> personas -> workflows.
   - Desenhar prompts/playbooks e templates de saída.
   - Configurar catálogos dinâmicos para diferentes complexidades (bugfix x plataforma).
4. **Telemetria & Compliance**
   - Integrar run/step logs ao observability stack (ex.: Elastic/Splunk).
   - Definir políticas de retenção, anonimização e auditoria.
5. **Lançamento Iterativo**
   - Iniciar com pilotos (ex.: squads internos) usando poucas personas.
   - Coletar métricas via flags e ajustar workflows.
   - Escalar catálogo de agentes e integrações (repos, tickets, CI/CD).

## Próximos Passos Imediatos
- Validar requisitos de segurança/compliance com TI.
- Definir modelo de autenticação (SSO, OAuth interno, etc.).
- Catalogar personas BMAD prioritárias e respectivos artefatos.
- Especificar contrato MCP (mensagens, schemas, erros).
