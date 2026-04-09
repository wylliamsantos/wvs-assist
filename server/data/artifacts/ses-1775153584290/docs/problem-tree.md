# undefined

Gerado automaticamente pelo workflow analysis.problem-tree.

## Resumo do Resultado
Olá. Eu sou a **Mary**, sua Business Analyst parceira.

Percebi que o input `product_brief` está indefinido no momento. Isso é comum no início de um **Fluxo Guiado de Descoberta**. Para não bloquearmos o avanço da equipe, ativei um **Plano de Ação de Descoberta**.

Este documento (`docs/problem-tree.md`) serve como **Estrutura Base (Template Ativo)**. Ele está configurado para capturar a lógica de causa-efeito assim que definirmos o enunciado do problema.

Abaixo está o artefato solicitado com o plano estruturado para avançarmos a descoberta.

---

# docs/problem-tree.md

```markdown
# 📄 Problem Tree: Estrutura de Diagnóstico
**Status:** Discovery (Fase Análise)  
**Autor:** Mary (BA)  
**Data:** 2023-10-27  
**Produto/Contexto:** [Por definir - Aguardando Product Brief]

---

## 1. 🎯 Objetivo da Sessão
Estruturar o diagnóstico inicial identificando:
1.  O problema central (Raiz do tronco).
2.  Consequências de negócio (Impactos - Ramos Direita).
3.  Causas fundamentais (Causas - Ramos Esquerda).
4.  Métricas para validação.

> **⚠️ Ação Crítica:** Preciso do *Product Brief* para preencher os campos `[ ]` abaixo. Caso não seja imediato, utilizaremos a árvore para priorizar o que investigar primeiro (Hypothesis-Driven).

---

## 2. 📉 Enunciado do Problema (Tope da Árvore)
*Definição provisória até o Brief:*
> "O valor percebido do usuário está abaixo do potencial de mercado" ou "Métricas de conversão não atingem os KPIs históricos".

**Problema Operacional Atual:**
`[DESCREVER AQUI O QUE A EQUIPE PERCEBE COMO PAIN PRINCIPAL - BASEADO NOS LEADS]`

---

## 3. 🍂 Impactos (Consequências Diretas)
*O que acontece se não resolvermos isso hoje? (Ramos Direita)*

| Categoria de Impacto | Descrição do Impacto | Métrica de Verificação (North Star/Lagging) |
| :--- | :--- | :--- |
| **Financeiro** | | |
| **Operacional** | | |
| **Satisf. Cliente** | | |

*(Aguardar dados do brief para preencher métricas exatas)*

---

## 4. 🎄 Causas Potenciais (Por que isso acontece?)
*Cada ramo deve ser investigado para encontrar a causa raiz. (Ramos Esquerda)*

- **H1: Produto/Funcionalidade**
    - A característica X está ausente?
    - A UX está causando fricção?
    - [Causa Específica Pendente]
- **H2: Usuário/Comportamento**
    - O usuário não entende o valor?
    - Há mudança de comportamento no mercado?
- **H3: Ambiente/Processos**
    - Falha no onboarding?
    - Suporte técnico lento?

---

## 5. 📊 Plan de Ação e Artefatos
*Ações concretas para validar a árvore nos próximos 5 dias.*

### 🚩 Ação 1: Validação de Hipóteses
- **Artifato:** `docs/user-persona-draft.md`
- **Responsável:** BA / PM
- **Entrega:** Definir quem é o usuário afetado por cada impacto listado acima.

### 🚩 Ação 2: Coleta de Dados Qualitativos
- **Técnica:** Customer Discovery Calls ou User Interviews.
- **Foco:** Perguntar "Por que?" pelo menos 5 vezes para chegar à raiz.
- **KPI:** Coletar 10-15 depoimentos relevantes para o problema central.

### 🚩 Ação 3: Análise de Dados
- **Fonte:** SQL/Analytics.
- **Foco:** Correlacionar os impactos financeiros com os pontos de abandono de usuário.

---

## 6. 📝 Próximos Passos (Next Steps)

1.  **Reunir Product Brief:** Solicitar input técnico/comercial urgente.
2.  **Refinar o Enunciado:** Converter a frase provisória em um enunciado SMART.
3.  **Workshop de Ideação:** Uma vez com as causas mapeadas, vamos gerar soluções para cada nó da árvore.

---
**Nota da Mary:** Este documento é vivo. Conforme o `product_brief` chega, iremos atualizar os impactos e causas imediatamente. Vamos focar em *soluções que resolvam a raiz*, não apenas os sintomas.
```

---

### ✅ Resumo da Sessão
*   **Artefato Gerado:** `docs/problem-tree.md`
*   **Ação Imediata:** Solicito confirmação para enviar um rascunho do `product_brief` ou autorizar o prosseguimento da fase de *Discovery* com base nas hipóteses listadas acima.

Aguardando seu feedback para darmos sequência.

## Próximos Passos
- Revisar com o time responsável e coletar comentários.
- Validar se os itens de "Inputs esperados" estão atualizados antes do próximo workflow.