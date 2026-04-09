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

> Dica: iniciar pela TUI (item 1) garante visibilidade rápida e permite testar os fluxos mesmo com backend mockado.
