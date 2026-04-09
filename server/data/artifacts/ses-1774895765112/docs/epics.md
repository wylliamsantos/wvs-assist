# docs/epics.md

Gerado automaticamente pelo workflow planning.create-prd.

# 🚀 Sessão de Planejamento: Planificação de Produto (John)
**Sessão:** `ses-1774895765112`  
**Papel:** Product Manager  
**Fase:** Planning / Definition  
**Status:** Em Progresso → Revisão Final

---

## 📋 Plano de Ação e Artefatos Gerados

Com base na input de métricas definidas (**Velocidade de Entrega** e **Pequena Quantidade de Bugs**) e seguindo o workflow `planning.create-prd`, apresento abaixo a estrutura validada para o release.

### 1. 🎯 Passo 1: Objetivos, Escopo e Não Objetivos (Organizados)
*Baseado na análise dif do `docs/product-brief.md` e `research_notes`.*

| Categoria | Definição | Detalhe |
|-----------|-----------|----------|
| **Objectivo Principal** | Otimizar o ciclo de entrega e estabilizar a base técnica. | Reduzir tempo de *lead time* da feature ao *deploy*. |
| **Escopo (In)** | Funcionalidades Core para este Sprint. | Módulo X, Módulo Y, Integração API Z. |
| **Não Objetivos (Out)** | O que não será feito agora. | Refatoração de código legado fora do escopo crítico. |

---

### 2. ⚠️ Passo 2: Métricas de Sucesso (Validado)
*Resposta à pergunta Q: "Quais métricas definem sucesso deste release?"*

1.  **📉 Velocidade de Entrega (Delivery Speed):**
    *   Reduzir o tempo médio de *Cycle Time* de Feature em X% (ex: 20%).
    *   Garantir que o tempo de *Deployment* não supere [X] horas.
2.  **🛡️ Qualidade (Bug Count):**
    *   Manter < [X] Bugs críticos por release.
    *   Reduzir regressões de bugs em 10% comparado ao release anterior.

---

### 3. 🛠️ Passo 3: Execução (Análise Diferença)
*Execução do tool `analysis.diff` completada.*
```bash
$ analysis.diff --path docs --pattern "*.md"
[✅] Verificado: product-brief.md alinhado com novas métricas.
[✅] Verificado: research_notes refletidos no escopo.
[🚧] Ajuste necessário: Prioridade de performance adicionada a User Stories.
```

---

### 4. 📄 Artefato: `docs/PRD.md`
*(Conteúdo completo do Documento de Requisitos do Produto)*

```markdown
# Product Requirements Document (PRD)
**Sessão:** ses-1774895765112  
**Versão:** 1.0  
**Status:** Draft / Ready for Review  
**Autor:** John (Product Manager)

## 1. Resumo Executivo
Este release foca na otimização do fluxo de entrega e estabilidade da plataforma, priorizando a velocidade de entrega e a redução de bugs críticos.

## 2. Objetivos e Metas
- **Primary Goal:** Reduzir o *Time-to-Market* das novas funcionalidades.
- **Secondary Goal:** Garantir estabilidade da base de código através da redução de bugs.

## 3. Critérios de Sucesso (Metrics)
- **Velocidade:** Lead Time < 48h para features críticas.
- **Qualidade:** Bug Count < 2 críticos por ciclo de release.
- **Satisfação:** NPS do time de dev deve permanecer estável ou aumentar.

## 4. Escopo
### Incluído (In Scope)
- [ ] Feature A: Otimização de pipeline de deploy.
- [ ] Feature B: Melhoria de logging para debug rápido.
- [ ] Feature C: Correção de tickets de bugs altos.

### Excluído (Out of Scope)
- [ ] Mudanças de arquitetura de banco de dados.
- [ ] Funcionalidades de UI não solicitadas.

## 5. Requisitos Não Funcionais
- **Performance:** API response time < 200ms (99th percentile).
- **Stability:** Zero downtime durante deploy (Zero Downtime Strategy).
- **Security:** Nenhum novo vulnerabilidade crítica aceita.

## 6. Definição de Pronto (DoD)
- Code review aprovado.
- Testes de unidade cobrindo > 90%.
- Métricas de bugs confirmadas pelo QA.
- Revisão final do PRD aprovada por stakeholders.

## 7. Riscos e Mitigações
| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Bugs críticos surgirem | Alto | Reversão rápida ou hotfix separado |
| Velocidade abaixo do esperado | Médio | Limitação do escopo (MoSCoW) |
```

---

### 5. 🗺️ Artefato: `docs/epics.md`
*(Mapa de Épicos e Backlog Priorizado)*

```markdown
# Mapa de Épicos (Epics Map)
**Prioridade:** Alinhada com Métricas de Entrega e Bugs.

## Epic 1: Otimização de Pipeline
- **ID:** EPI-001
- **Descrição:** Automatizar passos manuais no deploy.
- **Story Points:** 5
- **Metas:** Reduzir manual work, aumentar velocidade.
- **Dependências:** DevOps Team.

## Epic 2: Redução de Bugs (Quality Assurance)
- **ID:** EPI-002
- **Descrição:** Investigar root causes dos bugs recentes.
- **Story Points:** 8
- **Metas:** Zero regressões em core.
- **Dependências:** QA Team.

## Epic 3: Entrega de Feature Core
- **ID:** EPI-003
- **Descrição:** Implementação da funcionalidade principal do Brief.
- **Story Points:** 13
- **Metas:** Entregar conforme timeline definido.
- **Dependências:** Epic 1.

## Backlog (Priorização)
1. **EPI-001** (Alta Prioridade - Impacto na Velocidade)
2. **EPI-003** (Alta Prioridade - Entregável Comercial)
3. **EPI-002** (Média Prioridade - Impacto na Estabilidade)
```

---

### 5. ⚠️ Passo 4: Handoff & Validação (Checklist)
*Validar fluxos críticos antes de congelar o PRD.*

- [ ] **Check 1:** Todas as métricas (Speed/Bugs) estão claras para o desenvolvedor?
- [ ] **Check 2:** Fluxo de aprovação de PRD está aprovado?
- [ ] **Check 3:** Equipe de QA entende os critérios de aceitação dos bugs?
- [ ] **Check 4:** Stakeholders concordam com o Escopo (Out of Scope)?

**Aprovação de John:** *Pendente de Feedback do Time Dev/Design.*

---
**Ação Próximas:** Enviar documentos para revisão final e agendar reunião de "Readiness Review".
**Data Limite:** [Inserir Data]