# Catálogo de Templates de Artefatos

Os workflows geram arquivos reais no workspace (via `writeWorkspaceArtifact`). Use os caminhos abaixo como referência para revisão/versão.

## Análise / Planejamento
- `docs/product-brief.md`: Sumário de visão + objetivos do produto (Mary). Estrutura padrão: visão, oportunidades, KPIs.
- `docs/research-*.md`: Notas de pesquisa e benchmarks (Mary). Use nomeação por tema: `docs/research-mercado.md`.
- `docs/PRD.md`: Documento principal do John (visão, métricas, escopo, não-objetivos).
- `docs/epics.md` e `docs/stories/{story}.md`: backlog consolidado + stories individuais.
- `docs/ux-spec.md`: guia de UX com fluxos, personas e wireframes.

## Arquitetura
- `docs/architecture.md`: visão macro + diagramas lógicos (Winston).
- `docs/ADRs/*.md`: decisões arquiteturais com contexto, decisão e consequências.
- `docs/nfr-matrix.md`: matriz de requisitos não-funcionais e mitigação.
- `docs/observability-plan.md`: plano de monitoração/alertas alinhado às NFRs.
- `docs/integration-plan.md`: cronograma e owners das integrações externas.
- `docs/risks-register.md`: registro de riscos e planos de contingência.

## Implementação
- `docs/sprint-status.yaml`: tracking de épicos/stories por sprint (Bob).
- `{story}.context.xml`: contexto técnico para Amelia, com referências ao PRD/artefatos relevantes.
- `docs/hand-off-checklist.md`: checklist por área antes da virada.
- `docs/handoff-risks.md`: lista de riscos abertos no handoff.
- `docs/sprint-retro.md`: ata da retrospectiva com ações e donos.
- `docs/process-experiments.md`: experimentos Start/Stop/Continue aprovados.
- `docs/refactor-scout.md`: refactors priorizados por impacto.
- `docs/refactor-checklist.md`: guardrails para execuções de refactor.
- `docs/dev-digest.md`: resumo periódico de entregas e riscos.
- `docs/change-radar.md`: visão das mudanças críticas e responsáveis.

## Testes
- `docs/test-plan.md`: plano mestre, critérios de entrada/saída (Murat).
- `docs/traceability.md`: mapeia requisitos → casos de teste → estado atual.
- `docs/nfr-test-plan.md`: cenários e ferramentas para validar NFRs.
- `docs/perf-observations.md`: achados/telemetria de testes de carga.
- `docs/quality-gate-report.md`: relatório go/no-go com métricas chave.
- `docs/test-readiness-checklist.md`: checklist das pendências bloqueantes.

## Documentação
- `docs/index.md`: índice geral do projeto (Paige).
- `docs/api-contracts.md`: contratos OpenAPI/Swagger.
- `docs/user-guides/*.md`: guias orientados ao usuário final.
- `docs/changelog.md`: changelog cronológico com links e contexto.
- `docs/release-highlights.md`: destaques executivos de cada release.
- `docs/api-tutorial.md`: tutorial passo a passo para integrar com a API.
- `docs/api-samples/`: snippets organizados por linguagem/feature.

> Sempre que criar um novo template, atualize este catálogo e o playbook correspondente (campo `outputs`). Isso garante consistência entre o que o servidor gera e o que as demais personas consomem.
