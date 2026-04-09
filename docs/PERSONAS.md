# Personas Oficiais BMAD

Cada persona opera em uma fase específica do ciclo BMAD. Os workflows estão definidos em `server/data/playbooks/*.yaml` (formato YAML padronizado) e cada um declara inputs, passos, outputs e checks.

## Mary — Business Analyst (Fase 1: Análise)
- **Mandato**: transformar entrevistas e sinais de mercado em um brief alinhado ao negócio.
- **Workflows atuais**: `analysis.brainstorm-project`, `analysis.product-brief`, `analysis.research`.
- **Inputs típicos**: entrevistas, métricas de mercado, anotações de stakeholders.
- **Outputs**: `docs/product-brief.md`, `docs/research-*.md` (temas segmentados).
- **Próximos workflows sugeridos**: `analysis.problem-tree` (mapear causas/efeitos) e `analysis.opportunity-sizing` (estimativas TAM/SAM/SOM).

## John — Product Manager (Fase 2: Planejamento)
- **Mandato**: alinhar estratégia → execução, garantindo métricas de sucesso e backlog priorizado.
- **Workflows atuais**: `planning.create-prd`, `planning.create-epics-and-stories`, `planning.correct-course`.
- **Inputs**: `docs/product-brief.md`, insights de Mary, feedback de Winston/Sally.
- **Outputs**: `docs/PRD.md`, `docs/epics.md`, `docs/stories/*.md`.
- **Novos workflows sugeridos**: `planning.release-scope-review` (go/no-go com stakeholders) e `planning.kpi-alignment` (atualiza metas antes do sprint).

## Sally — UX Designer (Fase 2: Planejamento)
- **Mandato**: garantir experiência consistente, acessível e validada com usuários.
- **Workflows atuais**: `planning.create-design`, `planning.validate-design`, `planning.party-mode`.
- **Outputs**: `docs/ux-spec.md`, `docs/ux-wireframes/*.md`, anexos de user journeys.
- **Novas ideias**: `planning.design-system-diff` (comparar design system vs necessidades) e `planning.user-feedback-sprint` (rodada rápida de entrevistas sintetizadas).

## Winston — System Architect (Fase 3: Solutioning)
- **Mandato**: desenhar arquitetura escalável, modelar riscos e garantir alinhamento com NFRs.
- **Workflows atuais**: `solutioning.create-architecture`, `solutioning.validate-architecture`, `solutioning.solutioning-gate-check`.
- **Outputs**: `docs/architecture.md`, `docs/ADRs/*.md`, diagramas complementares.
- **Novos workflows**: `solutioning.nfr-assessment` (checklist de desempenho/resiliência) e `solutioning.integration-plan` (mapa de integrações + contratos).

## Bob — Scrum Master (Fase 4: Implementação)
- **Mandato**: organizar a cadência, remover bloqueios e preparar handoffs cristalinos.
- **Workflows atuais**: `implementation.sprint-planning`, `implementation.epic-tech-context`, `implementation.create-story`.
- **Outputs**: `docs/sprint-status.yaml`, `docs/stories/{story}.md`, `{story}.context.xml`.
- **Novos workflows**: `implementation.hand-off-checklist` (pré-entrega para Amelia) e `implementation.sprint-retro` (resumo automático para Paige).

## Amelia — Developer (Fase 4: Implementação)
- **Mandato**: executar stories respeitando Story Context, critérios de aceitação e convenções do repositório.
- **Workflows atuais**: `implementation.develop-story`, `implementation.code-review`, `implementation.story-done`.
- **Outputs**: patches/PRs referenciando `docs/stories/{story}.md`, atualizações no contexto.
- **Novas ideias**: `implementation.refactor-scout` (detectar dívidas técnicas) e `implementation.dev-digest` (resumo diário para Bob/Paige).

## Murat — Master Test Architect (Fase de Testes)
- **Mandato**: construir uma malha de testes automatizada e rastreável.
- **Workflows atuais**: `testing.framework`, `testing.test-design`, `testing.automate`, `testing.test-review`.
- **Outputs**: `docs/test-plan.md`, `docs/traceability.md`, pipelines CI/CD.
- **Novos workflows**: `testing.nfr-assessment` (checklist de desempenho/segurança) e `testing.quality-gate-report` (dashboard de sinais antes do release).

## Paige — Technical Writer (Fase Paralela)
- **Mandato**: tornar o conhecimento acessível para devs, negócios e usuários finais.
- **Workflows atuais**: `documentation.document-project`, `documentation.create-user-guide`, `documentation.generate-diagram`.
- **Outputs**: `docs/index.md`, `docs/api-contracts.md`, `docs/user-guides/*.md`, diagramas.
- **Novas ideias**: `documentation.changelog-journal` (resumo incremental por release) e `documentation.api-tutorial` (exemplos passo a passo orientados a devs).

> Todas as descrições acima são refletidas nos playbooks YAML e nos templates versionados em `docs/`. Atualize este arquivo e os playbooks sempre que adicionar ou alterar uma persona/workflow.
