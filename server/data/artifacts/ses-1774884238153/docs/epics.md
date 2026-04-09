# docs/epics.md

Gerado automaticamente pelo workflow planning.create-prd.

# 📋 Plano de Execução: Planejamento do Release
**Role:** John — Product Manager  
**Session ID:** ses-1774884238153  
**Workflow:** `planning.create-prd`  
**Status:** Em Execução  

---

## 🚀 Resumo do Plano de Ação

Com base na entrada do workflow, estruturarei os artefatos necessários para a aprovação do release. Seguirei o playbook definido:

1.  **[instruction] Organização:** Definirei objetivos claros, escopo de desenvolvimento e restrições (Out-of-Scope).
2.  **[question] Definição de Métricas:** Incorporarei o input fornecido (Orçamento e Prazo) como critérios críticos de sucesso.
3.  **[tool] Análise de Diferenças:** Simulação da análise de `analysis.diff` para garantir consistência entre brief e PRD.
4.  **[handoff] Validação:** Definirei o checklist de fluxos críticos para a validação com o time de Engenharia antes do *freeze*.

---

## 📂 Artefato 1: Product Requirements Document (PRD)
**Destino:** `docs/PRD.md`

```markdown
# PRD: Release [NOME DO FEATURE] v1.0
**Status:** Draft (Pre-Aprovação)  
**Session ID:** ses-1774884238153  
**Data de Criação:** [DATA ATUAL]  
**PM:** John  

---

## 1. Resumo Executivo
Este documento define os requisitos para o próximo ciclo de entrega. O foco principal é a entrega de valor funcional mantendo rigoroso controle sobre os recursos alocados (custo) e cronograma.

## 2. Objetivos e Resultados
### 2.1 Objetivo Principal
Entregar o escopo funcional definido para atender às necessidades dos usuários iniciais, respeitando as restrições operacionais.

### 2.2 Não Objetivos (Out of Scope)
- Novos módulos de marketing.
- Integrações externas além das já definidas no brief.
- Redesign completo da interface atual sem aprovação de UI/UX.

## 3. Métricas de Sucesso (Definition of Done)
Segundo as diretrizes do projeto, o sucesso deste release será avaliado primariamente por:

| Métrica | Critério de Sucesso | Responsável |
| :--- | :--- | :--- |
| **Prazo (Schedule)** | Entrega concluída até [DATA ALVADA] ± 2 dias | Eng. PM |
| **Orçamento (Budget)** | Custo final dentro de ± 10% do orçamento aprovado | Finanças / PM |
| **Qualidade Técnica** | Cobertura de teste > 80% | QA Lead |

> **Nota do PM:** Métricas de *business value* (ex: CAC, LTV, Retenção) serão revisadas no Q3, mas para este sprint/release, **Prazo e Orçamento** são os KPIs primários de bloqueio.

## 4. Escopo Funcional
### 4.1 Incluir
- Funcionalidades listadas nos épicos `docs/epics.md`.
- Migração de dados básica (se aplicável).
- Setup de monitoramento de logs.

### 4.2 Excluir
- Features de baixa prioridade listadas no backlog.
- Otimizações de performance não críticas.

## 5. Fluxos Críticos a Validar
Antes do *freeze*, o time deve validar:
1.  [ ] Fluxo de Login e Autenticação.
2.  [ ] Fluxo Principal da Feature (Happy Path).
3.  [ ] Tratamento de Erros e Logs de Debug.
4.  [ ] Compatibilidade com versões anteriores (Backward Compatibility).

## 6. Riscos e Mitigações
| Risco | Impacto | Mitigação |
| :--- | :--- | :--- |
| Escopo Creep (Scope Creep) | Alto | Travar requisitos fora da lista de épicos. |
| Retraso de Terceiros | Médio | Buffer de 20% no prazo de integração. |
| Supra-orçamento | Médio | Revisão de horas diárias do time (Burn Rate). |

---
*Document controlado por John. Aprovação necessária para iniciar desenvolvimento.*
```

---

## 🗺️ Artefato 2: Mapa de Épicos (Epics)
**Destino:** `docs/epics.md`

```markdown
# Mapa de Épicos: Release [NOME DO FEATURE]
**Prioridade:** Crítica / Prazo Rigoroso  
**Gerenciamento de Escopo:** Estrito  

---

## Epic 1: Infraestrutura de Entrega
- **ID:** EPIC-001
- **Objetivo:** Preparação do ambiente para lançamento sem interrupções.
- **Tarefas:**
  - Setup de branch `release/feature-v1`.
  - Configuração de CI/CD pipeline para deploy.
  - Atualização de dependências críticas.
- **Esforço:** 2.5 Person-Days
- **Status:** Planejamento

## Epic 2: Funcionalidade Principal
- **ID:** EPIC-002
- **Objetivo:** Implementação do core do produto conforme brief.
- **Tarefas:**
  - Backend API endpoints.
  - Frontend Componentes.
  - Integração com banco de dados.
- **Esforço:** 15.0 Person-Days
- **Status:** Planejamento

## Epic 3: Qualidade e Testes
- **ID:** EPIC-003
- **Objetivo:** Garantir estabilidade dentro do prazo de entrega.
- **Tarefas:**
  - Testes de unidade e integração.
  - Smoke tests antes do deploy.
  - Validação de orçamentário de horas de QA.
- **Esforço:** 6.0 Person-Days (Alocado a tempo integral)
- **Status:** Planejamento

## Epic 4: Deploy e Rollout
- **ID:** EPIC-004
- **Objetivo:** Publicação e verificação de smoke post-deploy.
- **Tarefas:**
  - Canary release.
  - Rollback plan em caso de erro crítico.
  - Documentação de Release Notes.
- **Esforço:** 2.0 Person-Days
- **Status:** Planejamento

---
*Validação de fluxos obrigatória antes de congelar requisitos.*
```

---

## ✅ Checkpoint de Handoff (Próximo Passo)

Antes de prosseguir para a fase de *Implementation*, precisamos validar o seguinte com a equipe de engenharia:

1.  **Orçamento:** O backlog técnico atual (burndown) é suficiente para suportar o escopo sem exceder o *cap* de horas.
2.  **Definição de "Razoável":** Alinhar a definição de "orçamento razoável" com o líder financeiro para evitar discrepâncias de scope creep.
3.  **Conclusão do Análise.diff:** Confirmar que não há divergências entre `docs/product-brief.md` e `docs/PRD.md`.

**Ação Sugerida:** Convocar o *Sprint Planning* para alinhar as histórias (User Stories) derivados desses épicos e confirmar a data de *Freeze*.