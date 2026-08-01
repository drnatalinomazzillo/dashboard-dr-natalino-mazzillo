# Status do Projeto - Dashboard Dr. Natalino Mazzillo - 31/07/2026

Documento de controle de status, pendências e melhorias do projeto.

---

## 📌 Status Atual: Integração Kommo Estável e 100% Funcional (Versão 49)
> [!NOTE]
> **Integração Kommo CRM → Planilha Corrigida e Otimizada**
> O envio de dados do Kommo CRM para a aba "Vendas" da planilha foi completamente reformulado no [Código.gs](file:///D:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/Código.gs). A integração agora diferencia os dois funis (Consulta vs. Procedimento), captura as datas corretas dos campos personalizados, previne duplicações em duas camadas e responde em sub-segundo (< 1s), eliminando retries automáticos.

### Próximos Passos & Pendências Futuras:
1. **⏳ Atualização de Status da Consulta (Pendência)**:
   * Implementar a lógica de webhook no Kommo para a etapa de alterar o status da consulta da Coluna K de **"Agendado"** para **"Realizado"**, garantindo que a atualização encontre apenas a linha da consulta e não altere linhas de procedimento do mesmo cliente.
2. **Implantação de Produção Frontend**:
   * Atualizar a constante `API_URL` caso seja feita uma nova implantação e realizar o build de produção (`npm run build`) para deploy no Netlify.

---

## 🚀 Melhorias Realizadas nesta Sessão (31/07/2026)

### 1. Diferenciação Dinâmica dos Funis do Kommo
* **Detecção por `pipeline_id`**: O script identifica automaticamente se o webhook veio do **Funil 1 - Consulta** (`12121252`) ou do **Funil 2 - Procedimento** (`12197743`).
* **Data da Venda (Coluna A)**: 
  - Funil 1 usa o campo personalizado `3041602` (Data Venda Consulta).
  - Funil 2 usa o campo personalizado `3026776` (Data Venda Procedimento).
  - Parser universal de datas criado para tratar timestamps Unix (segundos/ms) e strings de data formatadas.
* **Status (Coluna K)**: Usa `3026774` para Consulta e `3041658` para Procedimento.
* **Tipo (Coluna E)**: Gravação automática de "Consulta" ou "Procedimento" conforme o funil.

### 2. Dupla Trava Anti-Duplicação
* **1ª Camada (Cache de 30s)**: Bloqueia disparos paralelos instantâneos enviados pelo Kommo no mesmo segundo (`KOMMO_ADD_{leadId}_{pipelineId}`).
* **2ª Camada (Verificação na Coluna S)**: Gravação da chave única `leadId_Tipo_DataVenda` na **Coluna S**. O script lê apenas as últimas 20 linhas para verificar se a venda já existe antes de gravar, evitando linhas duplicadas por retries ou re-execuções.

### 3. Otimização de Performance (< 1s) e Fim dos Retries
* **Remoção de Logs Repetidos**: Removidas 5 chamadas intermediárias lentas de `debugSheet.appendRow()`, deixando apenas 1 gravação final de resumo.
* **Leitura Enxuta**: A verificação de duplicação foi reduzida para ler apenas as últimas 20 linhas (em vez da planilha inteira).
* **Resultado**: Tempo de execução reduzido de 3.5s para **< 1.0s**, garantindo resposta HTTP 200 OK imediata ao Kommo e eliminando os retries automáticos de 5min/15min.

### 4. Documentação Técnica Criada
* Criado o documento [documentacao-integracao-kommo.md](file:///D:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/documentacao-integracao-kommo.md) na raiz do projeto com a tabela completa de IDs de custom fields do Kommo, mapeamento de colunas da aba "Vendas" (A até S) e regras dos funis.

---

##  Melhorias Anteriores (30/05/2026)

### 1. Restabelecimento da API & Integração de IA (Gemini 3.5 Flash)
* **Gemini 3.5 Flash**: Modelo de IA atualizado no Apps Script para `gemini-3.5-flash`.
* **Prompt Enriquecido**: Mapeamento de conversão cruzada por gênero e localidade, CPL segmentado, custos reais e faturamento de consultas.

### 2. Leitura e Escrita do Gênero (Coluna N)
* Suporte completo para gravação e leitura do gênero ("Mulher" / "Homem") na Coluna N.

### 3. Funis de Conversão 3x3 e Gráficos
* Matriz de conversão cruzada de 9 funis (Barra, Cabo Frio, Online) × (Mulheres, Homens, Total).
* Gráfico de linha temporal com eixos Y duplos em `Recharts`.
