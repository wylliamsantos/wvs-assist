# Mapa de épicos

Gerado automaticamente pelo workflow planning.create-prd.

## Resumo do Resultado
**Status:** Sessão `ses-1774899113398` | Ativo
**Role:** John (Product Manager)
**Fase:** Planning (Criação de PRD)

Olá, time. John aqui. Acabei de processar os inputs da sessão e a resposta sobre as métricas de sucesso. Vamos formalizar o escopo e os requisitos antes de dar o *freezing* do PRD.

Abaixo apresento o plano de ação estruturado para finalizar o documento e os artefatos gerados (`docs/PRD.md` e `docs/epics.md`).

---

### 📋 Plano de Ação e Próximos Passos

1.  **Consolidação de Requisitos:** Transformar as notas de pesquisa e o brief em critérios de aceitação claros dentro do `docs/PRD.md`.
2.  **Definição de Métricas (OKRs):** Incorporar a resposta sobre *bugs* e *prazos* na seção de "Sucesso do Release" (ver artefato PRD).
3.  **Mapeamento de Épicos:** Quebrar o escopo em épicos manejáveis no `docs/epics.md`, garantindo que a entrega no prazo seja priorizada nos *milestones*.
4.  **Validação de Fluxo:** Antes do *freeze*, agendar um *review* com os Engineering Leads para validação dos fluxos críticos.

---

### 📄 Artefato 1: Product Requirements Document (docs/PRD.md)

```markdown
# PRD - Release v1.1 (Nome do Release)
**Autor:** John (PM)
**Status:** Draft -> Review
**Sessão:** ses-1774899113398

## 1. Contexto e Visão
Este release visa melhorar a estabilidade da plataforma e a velocidade de entrega de valor ao usuário, alinhando-se aos objetivos estratégicos da organização. Focamos em entregar features críticas com alta confiabilidade.

## 2. Objetivos do Release (OKRs)
- **Objetivo Principal:** Entregar novas funcionalidades sem comprometer a estabilidade do sistema atual.
- **Objetivo Secundário:** Facilitar a onboarding de novos usuários.

## 3. Escopo (In)
- Implementação de Feature A: Automação de Workflow.
- Otimização de Performance na carga de dados.
- Revisão de segurança em APIs públicas.

## 4. Não Objetivos (Out of Scope)
- Migração de banco de dados histórico (para o Release Q2).
- Mudança de design visual da UI principal (Foco em UX técnico).

## 5. Critérios de Sucesso e Métricas
*Respostas coletadas da fase de planejamento:*

| Métrica | Alvo | Definição |
| :--- | :--- | :--- |
| **Taxa de Bugs** | Redução > 20% | Qtd de bugs críticos < X por sprint. |
| **Entrega no Prazo** | 100% (Hard Constraint) | Data de deploy não deve exceder o planejado sem justificativa de *scope creep*. |
| **Satisfação (SUSI)** | > 4.5 | Feedback de usuários beta. |

## 6. Fluxos Críticos (Validação Pré-Freeze)
Antes do congelamento do PRD, deve-se validar:
1.  [ ] Fluxo de Autenticação de 3º Fator.
2.  [ ] Checkout de Pagamento (Caso aplicável).
3.  [ ] Gerência de Erros e Logging (Para controle de bugs).

## 7. Cronograma Estimado
- **Kickoff:** [Data]
- **MVP Ready:** [Data]
- **Go-Live:** [Data]
```

---

### 🗺️ Artefato 2: Mapa de Épicos (docs/epics.md)

```markdown
# Epic Map - Release v1.1

## Epica-01: Estabilidade e Confiabilidade (Prioridade Alta)
**Objetivo:** Garantir a entrega dentro do prazo sem regressão de bugs.
**Métricas:** Redução de bugs (KPI principal).
- [ ] Epic-01-01: Refatoração de módulos de alta criticidade.
- [ ] Epic-01-02: Implementação de testes de regressão automatizados.

## Epica-02: Novas Funcionalidades (Prioridade Média)
**Objetivo:** Entregar o valor planejado no brief.
**Métricas:** Taxa de adoção.
- [ ] Epic-02-01: Implementação do Workflow Automático.
- [ ] Epic-02-02: Dashboards de Status.

## Epica-03: Qualidade e Entrega
**Objetivo:** Cumprimento do prazo estipulado.
**Métricas:** Lead Time e Cycle Time.
- [ ] Epic-03-01: Revisão de arquitetura para paralelização.
- [ ] Epic-03-02: Gestão de Risco de Escopo.

## Epica-04: Onboarding e Docs
- [ ] Epic-04-01: Atualização da documentação técnica.
```

---

### 🛠️ Notas Técnicas do Workflow
- **[instruction]:** Escopo organizado, focando em não expandir o escopo (Scope Creep) para proteger a métrica de prazo.
- **[tool] `analysis.diff`:** Executada. Verificou-se que as notas de pesquisa não contradizem os objetivos do PRD.
- **[handoff]:** Lista de validação de fluxo crítica preparada. Agendar reunião de *Sync* com Tech Lead para revisão de arquitetura e testes.

**Próximo Passo:** Aguardar validação do time de Engenharia para *Sign-off* no PRD.

Qualquer ajuste no escopo ou métrica antes do *freeze*, por favor, notem imediatamente para reavaliar o cronograma.
```

## Próximos Passos
- Revisar com o time responsável e coletar comentários.
- Validar se os itens de "Inputs esperados" estão atualizados antes do próximo workflow.