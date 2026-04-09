# undefined

Gerado automaticamente pelo workflow analysis.problem-tree.

## Resumo do Resultado
# docs/problem-tree.md

**Título:** Problem Tree Analysis - Discovery Phase  
**Autor:** Mary (Business Analyst)  
**Data:** [Data Atual]  
**Status:** Rascunho / Análise de Gap  
**Versão:** 1.0

---

## 1. Resumo do Contexto (Current State)

Com base nas respostas coletadas durante a fase de Discovery, identificamos uma **alta incerteza**. O produto (`product_brief`) está indefinido, o que é esperado nesta fase inicial, mas as respostas qualitativas indicam lacunas críticas de entendimento.

| Pergunta | Resposta Recebida | Interpretação Técnica |
| :--- | :--- | :--- |
| Stakeholders Impactados | "sei la" | **Gap de Mapeamento:** Falta visibilidade de quem sente a dor ou o benefício. |
| Métricas/Prazos Definidos | "nunca" | **Gap de Sucesso:** Ausência de North Star Metrics ou KPIs de entrega. |
| Risco Externo/Principal | "o fim do mundo" | **Gap de Risco:** Percepção de crise não quantificada, exigindo priorização de mitigação de risco. |

---

## 2. Estruturação do Problem Tree

Esta árvore conecta as causas raiz das incertezas aos impactos negativos atuais, definindo o problema central para o time.

### 🍂 Fogo da Folha (Impactos Imediatos)
*O que estamos perdendo agora?*
- ❌ Falta de alinhamento entre times (Devido à ignorância sobre stakeholders).
- ❌ Impossibilidade de priorizar trabalho (Devido à ausência de métricas de sucesso).
- ❌ Ansiedade e gestão de crise sem base factual (Devido à percepção de risco extremo).
- ❌ Bloqueio de roadmap (Devido à falta de briefing do produto).

### 🌳 Tronco (Problema Central)
*Qual é o problema funcional que precisa ser resolvido?*
> **"Ausência de clareza sobre impacto, validação de sucesso e gestão de riscos críticos no cenário atual."**

*Definição:* Não temos como mensurar a saúde do projeto nem saber quem depende da entrega sem criar uma matriz de stakeholders e critérios de aceite.

### 🌱 Raízes (Causas Raiz)
*Por que esse problema existe?*
1.  **Ambiente de Briefing Incerto:** Produto em definição inicial (`undefined`).
2.  **Comunicação Assíncrona ou Inexistente:** Leva a respostas como "sei la".
3.  **Falta de Governança Inicial:** Sem definição prévia de KPIs e Riscos.
4.  **Percepção de Insegurança Organizacional:** O risco "fim do mundo" sugere que alguém está pressionando de fora sem contexto.

---

## 3. Plano de Ação Concreto (Action Plan)

Este plano visa estruturar a análise e forçar a clareza nos gaps identificados.

### 🚀 Fase 1: Estabilização e Mapeamento (Semana 1)
| Ação | Artefato Resultado | Responsável |
| :--- | :--- | :--- |
| **Workshop de Stakeholders:** Listar quem fala, quem faz e quem aprova. | Matriz de Stakeholders (RACI) | BA (Mary) |
| **Definição de Sucesso Mínimo:** Estabelecer 3 KPIs de "Go/No-Go". | Documentação de KPIs & OKRs | PO + BA |
| **Triagem de Risco:** Converter "fim do mundo" em riscos categorizados (Ex: Compliance, Financeiro, Reputação). | Matriz de Risco (Gut/High/Med) | Risk Owner + BA |

### 🧱 Fase 2: Estruturação do Produto (Semana 2-3)
| Ação | Artefato Resultado | Responsável |
| :--- | :--- | :--- |
| **Elaboração do Product Brief:** Preencher o `product_brief` com hipóteses. | Documento do Product Brief | PO |
| **Definição de Escopo MVP:** Delimitar o que entra e o que não entra para mitigar o risco. | User Stories Epics | BA |

### 📈 Fase 3: Validação e Ajuste (Semana 4)
| Ação | Artefato Resultado | Responsável |
| :--- | :--- | :--- |
| **Revisão com Stakeholders:** Confirmar quem está impactado com os dados reais. | Plano de Comunicação Interna | Comms + BA |
| **Re-calibração de Métricas:** Ajustar as métricas definidas com base no feedback. | Dashboard de Viabilidade | Analistas de Dados |

---

## 4. Artefatos Sugeridos para Criação

Para executar o plano acima, os seguintes documentos devem ser gerados e hospedados no Confluence/Drive:

1.  **`stakeholder_map.xlsx`**: Lista de todas as pessoas times, impacto esperado e nível de influência.
2.  **`kpi_definitions.pdf`**: Definição clara das métricas (Ex: Retenção, Ticket, Conversions) e linha da base (Baseline).
3.  **`risk_register.xlsx`**: Matriz de riscos onde "fim do mundo" deve ser decomposto em cenários prováveis (ex: Falha de infraestrutura, Mudança regulatória).
4.  **`product_brief_v1.md`**: Versão inicial do briefing do produto a ser preenchido.

---

## 5. Próximos Passos Imediatos (Next Steps)

1.  **Call de Alinhamento (30 min):** Agendar com o Product Owner para destravar o `product_brief`.
2.  **Entrevista de "Risco Falso":** Falar diretamente com a fonte do "fim do mundo" para entender o contexto específico e não tratar apenas como um mito.
3.  **Entrega do Artefato:** Submeter o `stakeholder_map` inicial para validação.

**Nota de Mary:** O problema "fim do mundo" é irrelevante sem contexto; o problema real é a falta de comunicação. Vamos focar em trazer dados e clareza para substituir a ansiedade por execução.

---
*Documento gerado automaticamente baseado no fluxo de descoberta.*

## Próximos Passos
- Revisar com o time responsável e coletar comentários.
- Validar se os itens de "Inputs esperados" estão atualizados antes do próximo workflow.