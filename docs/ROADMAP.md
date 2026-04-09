# Roadmap BMAD Internal Agent Platform

## Fase 1 — Fundamentos (Semanas 1-2)
1. **Cliente TUI MVP** ✅
   - Configuração Bun/Ink e layout base (sidebar, painel de logs, prompt).
   - Estado de sessões/workflows local + carregamento de config.
   - Mock de conexão MCP (dados estáticos).
   - Incrementos recentes: cards centralizados, painel magenta com resumos e atalhos PgUp/PgDn para navegar mensagens.
2. **Backend Stub** ✅
   - Endpoint `/auth/device` e `WS /mcp` fake retornando catálogos estáticos.
   - Estrutura de dados para personas/workflows.
3. **Documentação de Playbooks** ✅
   - Formalizar JSON/YAML de workflows e artefatos.

## Fase 2 — Integrações (Semanas 3-4)
4. **MCP Real** ⚙️
   - ✅ Handshake WS + fila de envio (`useMcpConnection`) e catálogo dinâmico vindo do stub.
   - ✅ Integração com LLM local (server chama Ollama/Qwen e retorna `workflow.run.output`).
   - ⏳ Falta persistir sessões no backend e habilitar streaming incremental.
5. **Tooling Local e Permissões**
   - Portar ferramentas (bash, glob, read, webfetch) com política de grants.
   - Logging local + envio para backend.
6. **Observabilidade Corporativa**
   - Hooks para run/step/request logs e integrações com stack interno.

## Fase 3 — Ready for Pilot (Semanas 5-6)
7. **Personas BMAD Completas** ✅
   - Playbooks em YAML padronizado para Mary, John, Sally, Winston, Bob, Amelia, Murat e Paige (`server/data/playbooks/`).
   - Templates versionados em `docs/` (ver `docs/ARTIFACT_TEMPLATES.md`) e personas detalhadas em `docs/PERSONAS.md`.
   - Backend replica todos os `outputs` para `server/data/artifacts/` e workspace com resumos/próximos passos.
8. **Segurança e Compliance**
   - Criptografia de tokens, políticas de reauth, análise de riscos.
9. **Pilotos Internos**
   - Onboarding de squads, coleta de feedback, ajustes.

## Fase 4 — Orquestração Híbrida (Semanas 7-8)
10. **Dual Mode: Guided + Expert Jump-in** 🆕
   - Introduzir `runMode` por sessão (`guided` | `expert`).
   - `guided`: fluxo ponta a ponta com travas por fase.
   - `expert`: acesso direto por especialidade (ex.: arquitetura, segurança, QA avançado) sem quebrar a jornada principal.
11. **Gates e Pré-requisitos por Fase** 🆕
   - Definir máquina de estados do workflow com transições válidas.
   - Validar critérios mínimos por fase (inputs obrigatórios, artefatos, checklist de aprovação).
   - Bloquear avanço quando gate não passar e explicar pendências em linguagem objetiva.
12. **Importação de Conselhos Isolados para Trilha Completa** 🆕
   - Permitir que resultados de sessões `expert` sejam anexados como evidência na trilha `guided`.
   - Registrar origem, assumptions e nível de confiança do output isolado.
   - Evitar retrabalho e preservar rastreabilidade entre sessões.

## Fase 5 — Governança de Skills e Qualidade Operacional (Semanas 9-10)
13. **Contrato de Skill/Playbook Versionado** 🆕
   - Schema versionado para playbooks (`inputs`, `outputs`, `checks`, `handoff`, `required_artifacts`).
   - Linter/validador de YAML antes da execução.
14. **Handoff Auditável entre Agentes** 🆕
   - Contexto estruturado no handoff (decisões, riscos, pendências, dono).
   - Histórico de decisão por etapa para auditoria e revisão posterior.
15. **UX de Orquestração no TUI** 🆕
   - Home com duas entradas claras: “Jornada Completa” e “Consultar Especialista”.
   - Painel de progresso com “o que falta para avançar” por gate.
   - Mensagens consistentes para sucesso/falha de validações.

> Dica: iniciar pela TUI (item 1) garante visibilidade rápida e permite testar os fluxos mesmo com backend mockado.
