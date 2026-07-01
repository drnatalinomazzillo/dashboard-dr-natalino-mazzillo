# Documento de Contexto do Projeto: DASH NATALINO (Dashboard Próximo Nível®)

## 📌 Sobre o Projeto
O **Dashboard Próximo Nível®** é um aplicativo focado em métricas financeiras, gestão de funil de vendas, resultados de marketing (anúncios no Meta/Google) e gerador de criativos, desenhado para a clínica/operações do Dr. Natalino Mazzillo.

Sua arquitetura de banco de dados e backend baseia-se centralmente no **Google Apps Script** via uma integração API (`API_URL`) responsável por ler planilhas, enviar vendas, gravar marketing e realizar chamadas na proxy da IA Gemini.

---

## 🛠️ O que foi realizado nesta sessão

1. **Restabelecimento da API e Atualização da IA (Gemini 3.5 Flash):**
   * A conexão com a API do Google Apps Script foi restabelecida com a nova URL de implantação ativa em [api.js](file:///x:/DASH%20NATALINO/dashboard-drnatalino-mazzillo/src/config/api.js).
   * O modelo de Inteligência Artificial foi atualizado para o **Gemini 3.5 Flash** no Apps Script ([Código.gs](file:///x:/DASH%20NATALINO/dashboard-drnatalino-mazzillo/Código.gs)), oferecendo análises mais profundas e rápidas.
   * O prompt da IA em [geminiService.js](file:///x:/DASH%20NATALINO/dashboard-drnatalino-mazzillo/src/services/geminiService.js) agora inclui métricas completas de conversão cruzada segmentadas por gênero e localidade para gerar insights de growth.

2. **Leitura, Gravação e Edição do Gênero (Coluna N):**
   * Configurada a leitura da Coluna N (Gênero: "homem"/"mulher") da aba "Vendas".
   * Adicionados seletores de Gênero ("Mulher" / "Homem") no formulário de lançar venda real ([SalesTab.jsx](file:///x:/DASH%20NATALINO/dashboard-drnatalino-mazzillo/src/components/sales/SalesTab.jsx)) e no modal de edição de vendas ([EditSaleModal.jsx](file:///x:/DASH%20NATALINO/dashboard-drnatalino-mazzillo/src/components/sales/EditSaleModal.jsx)) no Dashboard.
   * Ajustadas as funções `addSale` e `editSale` no Apps Script para persistir os dados na planilha.

3. **Cálculos de Conversão Cruzada e Exclusão de Branding:**
   * A lógica de distribuição proporcional de leads e custos por localidade e gênero foi refinada em [filters.js](file:///x:/DASH%20NATALINO/dashboard-drnatalino-mazzillo/src/utils/filters.js).
   * Campanhas de branding e engajamento (`ENGAJAMENTO`, `ENG`, `VIDEO`, `ALCANCE` na coluna H da aba "Marketing") são **excluídas automaticamente** dos cálculos de leads de filiais e CPL em [filters.js](file:///x:/DASH%20NATALINO/dashboard-drnatalino-mazzillo/src/utils/filters.js).
   * Implementados cálculos de leads, custos reais (com imposto de 12.15%), CPL, consultas (agendadas e realizadas), faturamento de consultas e procedimentos por gênero e filial em [calculations.js](file:///x:/DASH%20NATALINO/dashboard-drnatalino-mazzillo/src/utils/calculations.js).

4. **Painel Visual de Conversão Cruzada Avançado:**
   * O painel foi expandido para uma **matriz 3x3** (9 funis no total), comparando unidades (Cabo Frio, Barra, Online) x gêneros (Mulher, Homem, Agregado) em [AnalyticsTab.jsx](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/src/components/analytics/AnalyticsTab.jsx).
   * Inclusão do **Faturamento Total** (Consultas + Procedimentos) e **ROAS** no fim do funil. 
   * A linha "Online" oculta o topo do funil inteligentemente para evitar dados nulos.

5. **Gráfico de Evolução Temporal:**
   * Inclusão da biblioteca `recharts` para montar um gráfico interativo de linhas.
   * O gráfico mostra a evolução de **CPL, Consultas e Faturamento** no período, com eixos duplos para cruzar métricas de grandezas variadas, agrupando por dia ou mês dependendo do filtro selecionado.

6. **Padronização de Cadastros e Filtros:**
   * "Paciente Antigo" adicionado ao catálogo de origens.
   * "Site Institucional" padronizado para gravar e exibir apenas como "SITE" (maiúsculo) na planilha.
   * Filtro "Este Ano" adicionado às ferramentas de análise.

---

## 🚀 Próximos Passos (Para a Próxima Sessão)

1. **Validação Operacional em Homologação/Produção:**
   * Testar a inserção de novas vendas reais com gênero selecionado e validar a gravação na planilha "Vendas" (coluna N).
   * Testar a função "Análise Inteligente" na interface do Dashboard para validar a resposta do Gemini 3.5 Flash.
2. **Publicação / Deployment:**
   * Atualizar o script do Google Apps Script com a versão mais recente e publicar nova versão se houver mudanças.
   * Realizar o build de produção final (`npm run build`) e atualizar os arquivos estáticos no Netlify.
