# Formato de Playbooks (Draft)

Cada workflow BMAD será modelado em YAML (ou JSON equivalente) como abaixo:

```yaml
id: plan.feature-spec
persona: product-architect
phase: planning
summary: "Detalhar feature specification com inputs do PRD"
inputs:
  - key: prd_path
    description: "Caminho para PRD.md"
  - key: backlog
    description: "Issues relevantes"
steps:
  - type: instruction
    text: "Leia o PRD e identifique gaps."
  - type: question
    prompt: "Quais requisitos estão faltando?"
  - type: tool
    name: research.rag
    params:
      query: "Analisar requisitos similares"
outputs:
  - path: docs/feature-spec.md
    description: "Documento gerado"
  - path: logs/plan-feature.json
    description: "Registro estruturado"
checks:
  - type: gate
    condition: "todos os requisitos cobertos"
```

## Convenções
- `id`: slug único `fase.workflow`.
- `persona`: agente responsável.
- `phase`: referência às fases do roadmap.
- `steps`: podem ser `instruction`, `question`, `tool` (chamando ferramentas locais/remotas) ou `handoff`.
- `outputs`: artefatos esperados.
- `checks`: gates de aprovação (ex.: `gate`, `review`).

## Próximos passos
- Serializar playbooks reais em `server/data/playbooks/*.yaml`.
- Backend MCP deve carregar esses arquivos e servir via `/catalog/agents` e `workflow.run`.
- Novos workflows sugeridos:
  - `analysis.problem-tree`, `analysis.opportunity-sizing` (Mary)
  - `planning.release-scope-review`, `planning.kpi-alignment` (John)
  - `planning.design-system-diff`, `planning.user-feedback-sprint` (Sally)
  - `solutioning.nfr-assessment`, `solutioning.integration-plan` (Winston)
  - `implementation.hand-off-checklist`, `implementation.sprint-retro` (Bob)
  - `implementation.refactor-scout`, `implementation.dev-digest` (Amelia)
  - `testing.nfr-assessment`, `testing.quality-gate-report` (Murat)
  - `documentation.changelog-journal`, `documentation.api-tutorial` (Paige)
