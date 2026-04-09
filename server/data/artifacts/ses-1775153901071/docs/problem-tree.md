# undefined

Gerado automaticamente pelo workflow analysis.problem-tree.

## Resumo do Resultado
# docs/problem-tree.md

```markdown
# Problem Tree Analysis & Discovery Plan

| Metadata | Details |
| :--- | :--- |
| **Autor** | Mary (Business Analyst) |
| **Data** | 24/05/2024 |
| **Status** | 🟡 Discovery in Progress |
| **Fase** | Analysis - Problem Discovery |
| **Input Atual** | `product_brief`: *Undefined* (Aguardando definição de contexto) |
| **Prioridade** | Alta |

---

## 1. Objetivo do Documento
Este documento serve como o *canvas* inicial para a estruturação do **Problem Tree** (Árvore de Problemas). Como o `product_brief` ainda está indefinido, este artefato é um **Framework de Descoberta** projetado para capturar a problemática, validar hipóteses e alinhar o time sobre causas e impactos antes da definição do escopo final do produto.

---

## 2. Problema Central (Hypothetical)
*Devido à falta de `product_brief` específico, a seguir estão os campos para preenchimento uma vez que as informações de negócio forem coletadas.*

- **Proposta de Declaração do Problema (Draft):**
  > "O usuário [Público-Alvo] encontra-se incapaz de [Ação Principal] quando tenta [Contexto], resultando em [Impacto Negativo]. Nós, a equipe de produto, acreditamos que a causa raiz é [Hipótese de Causa Raiz]."
  
- **Status do Problema:**
  - 🔄 *Open / Discovery*
  
---

## 3. Estrutura da Árvore de Problema (Draft)
*Esta seção deve ser populada durante as entrevistas com stakeholders e análise de dados. Utilize o formato abaixo para estruturar a lógica de causa-efeito.*

### 3.1. Impactos (Consequências)
| Impacto Direto | Impacto Indireto | Severidade |
| :--- | :--- | :--- |
| *(Ex: Churn de clientes)* | *(Ex: Dano à reputação)* | 🔴 🟠 🟢 |
| *(Ex: Redução de ticket médio)* | *(Ex: Custos operacionais de suporte)* | 🔴 🟠 🟢 |
| *(Preencher)* | *(Preencher)* | *(Preencher)* |

### 3.2. Causas Raiz (Root Causes)
*Foco: Por que isso está acontecendo?*
- **Causa 1:** *(Ex: Falta de funcionalidade X no onboarding)*
- **Causa 2:** *(Ex: Confusão na jornada de pagamento)*
- **Causa 3:** *(Ex: Processos internos lentos)*

### 3.3. Métricas-Chave (Metrics)
Para validar a existência e magnitude do problema, definimos as seguintes métricas iniciais:

| Nome do Métrico | Fórmula / Fonte | Alvo Atual | Alvo Esperado | Freq. de Medição |
| :--- | :--- | :--- | :--- | :--- |
| **Churn Rate** | `(#Cancelamentos / #Base Clientes)` | *X%* | *Y%* | Semanal |
| **Taxa de Conclusão** | `(Passos Finalizados / Passos Início)` | *X%* | *Y%* | Diária |
| **NPS / CSAT** | *(Enquetes)* | *(Ponto X)* | *(Ponto Y)* | Mensal |
| **Tempo de Resposta** | `(Tempo Total - Tempo Manual)` | *(Minutos)* | *(Minutos)* | Contínuo |

---

## 4. Plano de Descoberta (Action Plan)
*Passos concretos para finalizar o `product_brief` e preencher a árvore acima.*

| ID | Ação | Responsável | Artefato Sugerido | Prazo (Est.) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Coleta de Contexto** | BA (Mary) | `docs/product_brief.md` | Dia 1-2 |
| 2 | **Entrevista com Stakeholders** | BA + PM | `docs/stakeholder-feedback.md` | Dia 3 |
| 3 | **Análise de Dados (Metrics)** | Data Analyst | `docs/data-exploration.md` | Dia 4-5 |
| 4 | **Validação do Problema** | Product Owner | `docs/problem-hypothesis-validation.md` | Dia 6 |
| 5 | **Refinamento do Problem Tree** | Time Tech | `docs/problem-tree.md` (Atualizado) | Dia 7 |

---

## 5. Artefatos Sugeridos para o Próximos Passo
Para dar continuidade ao fluxo de Discovery do Problema, a equipe deve gerar:

1.  **`product_brief.md`**: Documento que define o contexto do produto, metas e usuários.
2.  **User Pain Point Interviews**: Notas estruturadas com feedback de suporte/clientes.
3.  **Qualitative Data Report**: Resumo de pesquisas de satisfação e logs de erros.

---

## 6. Instruções de Implementação
1.  **Aguardar**: Enquanto o `product_brief` não for definido, este documento permanece como um modelo.
2.  **Preencher**: Assim que o contexto do produto for compartilhado (Input), substitua os marcadores `[Preencher]` nos Impactos e Causas.
3.  **Alinhamento**: Reunir o time para validar as métricas propostas na Tabela 3.2.
4.  **Comunicação**: Compartilhar este draft com a equipe para garantir transparência na direção do problema.

---
*Documento controlado pela equipe de Business Analysis.*
```

## Próximos Passos
- Revisar com o time responsável e coletar comentários.
- Validar se os itens de "Inputs esperados" estão atualizados antes do próximo workflow.