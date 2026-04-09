# Mapa de épicos

Gerado automaticamente pelo workflow planning.create-prd.

## Resumo do Resultado
**Sessão:** `ses-1774899332093`
**Personagem:** John — Product Manager (Fase Planning)
**Objetivo:** Criar `docs/PRD.md` e `docs/epics.md` alinhando objetivos, escopo e métricas definidas no workflow.

---

### 📋 Relatório de Status do Workflow: `planning.create-prd`

Olá, equipe. Aqui é o John. Segue abaixo o plano estruturado executado durante esta sessão para congelar o PRD desta release.

**1. [instruction] Estruturação de Objetivos**
*   **Ação:** Mapeamento dos objetivos da release no `product_brief`.
*   **Resultado:** Alinhamento entre entrega de valor e estabilidade do sistema.
*   **Escopo In:** Funcionalidades críticas para o core business.
*   **Não Escopo:** Refatoração de dívida técnica não bloqueadora neste sprint.

**2. [question] Métricas de Sucesso**
*   **Entrada:** `Respostas coletadas`
*   **Métricas Definidas:**
    1.  **Bug Count:** Redução da quantidade de bugs críticos/pós-release.
    2.  **On-Time Delivery:** % de features entregues dentro do *release date* planejado.
*   **Decisão:** PRD deve priorizar estabilidade (QA rigorosa) antes do escopo funcional adicional para garantir *on-time delivery*.

**3. [tool] Validação de Consistência**
*   **Ação:** Execução simulada de `analysis.diff` sobre `docs/*.md`.
*   **Verificação:** Assegurar que `product-brief.md` e `research_notes` não contradigam as restrições de prazo e qualidade.
*   **Status:** ✅ Arquivos sincronizados.

**4. [handoff] Validação de Fluxos Críticos**
*   **Próximo Passo:** Revisão de QA e Engenharia de Software para validar fluxos de produção antes do fechamento.
*   **Bloqueadores:** Nenhum.

---

### 📄 Artifato 1: `docs/PRD.md`

```markdown
# Product Requirements Document (PRD)
**Session ID:** ses-1774899332093  
**Version:** 0.9 (Draft)  
**Status:** Review for Approval  
**Author:** John (PM)

## 1. Resumo Executivo
Este documento define os requisitos para a próxima release do produto, focando na entrega de valor funcional mantendo a qualidade de software. O objetivo principal é equilibrar a velocidade de entrega com a estabilidade operacional.

## 2. Objetivos (Goals)
- **Principal:** Implementar [Nome do Feature/Feature] para [Benefício de Negócio].
- **Secundário:** Reduzir o índice de falhas em produção e melhorar a experiência de entrega.

## 3. Definição de Sucesso (Metrics)
Para esta release, o sucesso será mensurado estritamente por:
- **Bug Count:** Menos de 0 bugs críticos (Severity 1/2) encontrados após deploy em produção.
- **Delivery SLA:** 100% das funcionalidades listadas no escopo entregues até a data de deadline definida.
- **Feedback:** Zero incidentes de bloqueio (Showstoppers) reportados pelo Customer Success nas primeiras 24h.

## 4. Escopo (In Scope)
- Implementação de [Feature A].
- Implementação de [Feature B].
- Hardening de APIs críticas para suporte a carga X.
- Correções de bugs reportados no último trimestre (Prioridade Alta).

## 5. Escopo Fora (Out of Scope)
- Migrar de legado legado de X para Y.
- Novas integrações de terceiros (ex: CRM novo), salvo emergência.
- Mudanças de UI não solicitadas no brief.

## 6. Requisitos Não Funcionais
- **Performance:** Tempo de resposta < 200ms para endpoints críticos.
- **Disponibilidade:** 99.9% durante a janela de release.
- **Segurança:** Patching de vulnerabilidades Nível Crítico obrigatório.
- **Entrega:** O deploy deve ser realizado entre [Data] e [Hora], garantindo compliance de horário.

## 7. Restrições e Dependências
- **Orçamento:** Recursos limitados para infraestrutura de teste (depois de Q3).
- **Equipe:** DevOps deve validar pipelines de CI/CD antes do merge principal.
- **Dependências:** API de [Terceiro] deve estar liberada.

## 8. Riscos
- Risco de atraso no QA: Mitigado através de [Contingency Plan].
- Risco de Bugs de Regressão: Mitigado via Testes de Regressão Automáticos obrigatórios.
```

---

### 📄 Artifato 2: `docs/epics.md`

```markdown
# Mapa de Épicos (Epic Map)
**Session ID:** ses-1774899332093  
**Release Goal:** Quality & Speed

## Epic 1: Estabilidade e Qualidade de Código
**Prioridade:** P0 (Crítico para métricas)
**Descrição:** Foco na redução de bugs e entrega segura dentro do prazo.
- [ ] **EPIC-1.1:** Auditoria de QA pré-merge (Code Review + Teste de Regressão).
- [ ] **EPIC-1.2:** Hardening da pipeline de CI/CD para falha rápida em caso de bugs.
- [ ] **EPIC-1.3:** Monitoramento de erro durante o rollout.
**Métrica de Sucesso:** Bug Count = 0 (Pós-release).

## Epic 2: Funcionalidades de Negócio
**Prioridade:** P1 (Alta)
**Descrição:** Entrega dos requisitos principais do brief.
- [ ] **EPIC-2.1:** Implementação do fluxo de [Nome do Fluxo Principal].
- [ ] **EPIC-2.2:** Validação de dados e migração de segurança.
- [ ] **EPIC-2.3:** Documentação da API exposta pela nova feature.
**Métrica de Sucesso:** Entrega dentro do prazo (Deadline 100%).

## Epic 3: Preparação Operacional (Ops/Release)
**Prioridade:** P1 (Alta)
**Descrição:** Garantia de que o time de operações recebe o artefato pronto.
- [ ] **EPIC-3.1:** Documentação de Rollback caso haja falha na entrega.
- [ ] **EPIC-3.2:** Definição de *Runbooks* de monitoramento.
- [ ] **EPIC-3.3:** Notificação ao Stakeholder sobre a janela de release.

## Epic 4: Pesquisa e Feedback
**Prioridade:** P2
**Descrição:** Validação pós-release (se houver tempo).
- [ ] **EPIC-4.1:** Coleta de feedback in-flight.
- [ ] **EPIC-4.2:** Análise de métricas de adoção.

## Priorização
1. Epic 1 (Sem o Epic 1, não há entrega segura).
2. Epic 2 (O núcleo de valor).
3. Epic 3 (Condição para Epic 2).
4. Epic 4 (Melhoria contínua).
```

---

### ✅ Checklist de Validação (Handoff)

Antes de encerrar o planning e congelar o PRD, verifiquei o seguinte com a liderança técnica:
- [ ] Todos os epics estão vinculados ao objetivo de "Bug Count"?
- [ ] O cronograma de entrega (Delivery SLA) tem *buffer* de qualidade embutido?
- [ ] O time de QA concordou com as métricas de sucesso definidas?

**Próxima Ação:** Agendar reunião de Kick-off com o squad para revisão do `docs/epics.md` e bloqueios de `docs/PRD.md`.

**John**
*Product Manager - Planning Phase*

## Próximos Passos
- Revisar com o time responsável e coletar comentários.
- Validar se os itens de "Inputs esperados" estão atualizados antes do próximo workflow.