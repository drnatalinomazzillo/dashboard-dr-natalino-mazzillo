# Status do Projeto - Dashboard Dr. Natalino Mazzillo - 06/10/2026

Documento de controle de status, pendências, automações e melhorias estruturais do projeto.

---

## 📌 Status Atual: Funil Cascata Global, Status de Procedimentos e Expurgo de Cancelamentos
> [!NOTE]
> **Consistência de Negócio e Visão Global da Operação**
> 1. **Procedimentos Cancelados**: Descontados do faturamento líquido total e da evolução temporal, com medição da quantidade, taxa de cancelamento (%) e montante financeiro cancelado (R$).
> 2. **Funil Cascata Global da Operação**: Implantado logo acima da evolução temporal (design inspirado no Simulador), consolidando o funil de toda a clínica de ponta a ponta.
> 3. **Taxa de Comparecimento de Consultas**: Exibida em todos os cards do funil (`FunnelCard`) e detalhada no card de Status Consultas.

---

## 🚀 Melhorias Realizadas na Sessão Atual (06/10/2026)

### 1. Gestão e Expurgo de Procedimentos Cancelados (Coluna K)
* **Regra de Faturamento**: Procedimentos com status `"Cancelado"` ou `"Cancelado / Não Compareceu"` agora são expurgados do `total`, `totalProcedimento`, faturamentos segmentados e da curva diária da evolução temporal.
* **Métrica Financeira Perdida**: Contabilização do `revenueProcCancelado` (R$ financeiro perdido) e exibição em destaque com badge negativo.
* **Taxa de Cancelamento**: Cálculo da proporção de cancelamentos sobre o total bruto de procedimentos.

### 2. Novo Card "Status Procedimentos" e KPIs Simétricos
* Criação do card dedicado **"Status Procedimentos"** ao lado de Vendas Procedimentos: Realizado (%), Agendado (%) e Cancelado (%) com valor financeiro cancelado.
* Atualização do card **"Status Consultas"** para incluir as porcentagens de Realizada (taxa de comparecimento), Agendada e Cancelada.
* **Preservação dos Ciclos**: Mantida a sequência exata dos 3 cards de ciclo (`Lead > Consulta`, `Lead > Procedimento`, `Consulta > Procedimento`).

### 3. Taxa de Comparecimento nos Cards do Funil (`FunnelCard`)
* Bloco `2. Consultas` na Matriz 3x3 agora exibe: `{cons} ({realCons} Realiz. • {taxaRealiz}%)`.

### 4. Funil Cascata Global da Operação (Acima da Evolução Temporal)
* Incorporação do design de alta fidelidade de [SimulatorTab.jsx](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/src/components/simulator/SimulatorTab.jsx) diretamente na tela de Resultados:
  * **1. Leads Totais (100%)**: Leads, Investimento Real (+12,15%) e CPL Real $\to$ Chevron de Conversão Lead $\to$ Consulta.
  * **2. Consultas (95%)**: Vendidas, Realizadas (% Comparecimento) e CPA Consulta $\to$ Chevron de Conversão Consulta $\to$ Procedimento.
  * **3. Procedimentos Válidos (90%)**: Vendas líquidas, Cancelados (% e R$ cancelado) e CPA Procedimento $\to$ Chevron de Ticket Médio.
  * **4. Faturamento Líquido Real (85%)**: Faturamento Total e ROAS Consolidado da Operação.

---

## 🚀 Melhorias Anteriores (26/09/2026)

### 1. Gráfico Híbrido de Evolução Temporal (`ComposedChart`)
* **Tráfego em Barras na Base**: Investimento plotado em colunas verticais com largura controlada (`maxBarSize={30}`) e padding zerado na base, garantindo proporção matemática real (ex: R$ 5k aparenta exatamente 1/3 visual de R$ 15k).
* **Faturamento Prioritário no Topo**: Eixo de receita (`yAxisId="revenue"`) ocupando de 50% a 95% da altura superior, impedindo inversão visual em relação ao tráfego.
* **Hierarquia Vertical Multi-Eixo**: Leads na zona intermediária e métricas de volume reduzido (Consultas e Procedimentos) em eixo secundário calibrado (`yAxisId="funnelSub"`), permitindo leitura de curvas sem compressão contra o chão.
* **Rótulos nos Pontos (`LabelList`) com Chavinha Interativa**:
  - Inclusão de `<LabelList>` em todas as séries do gráfico (Tráfego, Faturamento, Leads, Consultas, Procedimentos e CPL Médio).
  - Adição de botão seletor tátil estilo toggle switch no cabeçalho do painel ("Rótulos no Gráfico: ON / OFF") para ligar e desligar os valores impressos em tempo real.
* **Correção de Impostos no Tráfego (+12,15%)**: Incorporação do fator fiscal `* 1.1215` na função `generateEvolutionData`.

### 2. Automação Oficial do Meta Ads via Zernio API (`ImportacaoMeta.gs.gs`)
* **Bypass de Conta de Desenvolvedor Bloqueada**:
  - Conexão homologada estabelecida através da **Zernio API** (`accountId: 6ab74c485979849b7b7c2aa8` / `adAccountId: act_1804531293341421`).
  - Dispensa a necessidade de aprovação de aplicativo próprio ou conta no *Meta for Developers*.
* **Auditoria e Validação de Regras de Negócio**:
  - Comparação do dia 15/09 contra a planilha manual histórica: **100% de paridade** em valores, leads, locais e categorias.
  - Mapeamento fiel das regras:
    - Homem Padrão ➔ Conversão customizada `1404206547711370`.
    - Mulher / Lipo UHD ➔ Pixel customizado `fb_pixel_custom`.
    - Filiais ➔ Detecção automática por sufixo de conjunto (`- CF` = Cabo Frio, `- RJ` = Barra da Tijuca, `- RJ e CF` = Ambos).
* **Sincronização Retroativa & Acionador**:
  - Execução da carga de 21/09 a 25/09: **50 linhas inseridas** (10 conjuntos por dia), R$ 3.010,24 de investimento bruto e 78 leads.
  - Acionador do Apps Script configurado para rodar `importarDadosOntemAutomatico` toda madrugada (05h00 às 06h00).

### 3. Integração Meta Conversions API (CAPI) & "Botão Mágico" (`meta_capi_sync.gs`)
* **Fluxo Semi-Automático de Controle Total ("Botão Mágico")**:
  - Menu no Google Sheets `⚡ Meta CAPI` com a opção **"🎯 1. Preparar Apenas Linhas Selecionadas com o Mouse"**.
  - O gestor audita e confere as vendas na aba `Vendas`, seleciona as linhas com o mouse e clica no botão.
  - Os dados são higienizados e transferidos para a aba `META_COMPRA` com colunas de auditoria (O, P, Q) em branco prontas para o envio.
* **Padronização Exata das Colunas na aba `META_COMPRA`**:
  - **Coluna A (`event_name`)**: `'Purchase'`.
  - **Coluna B (`event_time`)**: `YYYY-MM-DDT12:00:00-03:00` (ISO completo com horário e timezone -03:00).
  - **Coluna C**: Em branco `""` (sem Action Source desnecessário).
  - **Coluna D (`event_id`)**: `COMPRA-YYYYMMDD-PRIMEIRO-SEGUNDO-SOBRENOMES` (padronizado em caixa alta, sem acentos, com hifens, ex: `COMPRA-20260924-PAULA-FRIZO-OSHIKAWA`).
  - **Colunas E e F**: Primeiro Nome (`Paula`) e Sobrenome (`Frizo Oshikawa`).
  - **Colunas G e H**: E-mail e Telefone com DDI (`5522981731626`).
  - **Coluna I**: Em branco `""` (External ID desnecessário).
  - **Coluna J (`purchase_type`)**: Estritamente `'procedimento confirmado'` ou `'consulta confirmada'` (padronizado em minúsculas).
  - **Coluna K (`location`)**: Unidade (`Cabo Frio` / `Barra da Tijuca`).
  - **Coluna L (`sale_origin`)**: Origem concatenada com a Tag completa (ex: `Tráfego Pago (Ref: LMCFUHD-50)-Novos-Criativos-Agosto` ou `Reativação Cliente (Lead Antigo) ORGÂNICO`).
  - **Coluna M e N**: Valor da Venda numérico (`55000`) e Moeda (`BRL`).
  - **Colunas O, P e Q**: `Status` (`TRUE` após envio), `Sent At` (data/hora) e `Response` (FBTrace ID retornado pela Meta).
* **Dupla Trava Anti-Duplicação**:
  - **Camada Planilha**: A função `syncMetaCompra` pula imediatamente qualquer linha com `TRUE` na Coluna O (`sentFlag === 'TRUE'`).
  - **Camada Meta CAPI**: O `event_id` único no payload garante que a própria Meta descarte duplicidades nas últimas 48h a 7 dias.
  - **Trava de Preparação**: Checagem de Coluna D na inserção impede que vendas já existentes na `META_COMPRA` sejam adicionadas novamente.
* **Cron Noturno Agendado**:
  - Função `executarSyncNoturnoMetaCapi` configurada no acionador diário do Google Apps Script (03h00 às 04h00), despachando compras pendentes na nuvem com hash SHA-256 e feedback linha a linha.

---

## 🗺️ Roadmap Estratégico: Migração para Supabase & Carga Histórica 2026 (Meta 2027)

Documentação do plano de transição da infraestrutura de banco de dados do **Google Sheets** para o **Supabase (PostgreSQL)**, visando virar o ano de 2027 com sistema de alta performance, sem travas de concorrência e com histórico completo preservado.

### 1. Por que migrar para o Supabase?
* **Velocidade de Carga**: Redução do tempo de carregamento de ~3.5s para menos de 100ms.
* **Concorrência Confiável**: Fim das travas de planilha (`LockService.tryLock(10000)`) que podem falhar com acessos simultâneos de vendedores e webhooks.
* **Integridade de Dados e Tipagem Estrita**: Datas como `timestamp`, moedas como `decimal(10,2)` e chaves únicas `UNIQUE` no banco, eliminando erros de digitação humana ou células corrompidas.
* **Segurança Profissional**: Autenticação nativa com JWT e criptografia de senhas (substituindo a checagem em texto puro na aba "Admin").

### 2. Estratégia de Migração do Histórico de 2026 (ETL)
Para não perder nenhum dado acumulado ao longo de 2026:
1. **Exportação das Abas**: Extração automatizada das abas "Vendas", "Marketing" e "Criativos" via script Node.js ou exportação CSV do Google Sheets.
2. **Higienização de Tipos**: Tratamento de datas brasileiras (`dd/MM/yyyy` e ISO), conversão de valores monetários com vírgula para ponto flutuante e padronização de nulos.
3. **Carga em Lote (Bulk Insert)**: Inserção no PostgreSQL do Supabase mantendo todas as referências de datas, criativos, filiais e IDs do Kommo CRM.
4. **Validação Cruzada**: Conferência dos totais de faturamento e investimento de 2026 entre a planilha e o banco para garantir paridade de 100%.

### 3. Modelo de Dados Alvo no PostgreSQL
* **`sales`**: `id`, `date`, `client`, `phone`, `email`, `type` (Consulta/Procedimento), `value`, `lead_date`, `seller`, `procedure_detail`, `location`, `status`, `consultation_date`, `gender`, `kommo_lead_id` (UNIQUE), `created_at`.
* **`marketing`**: `id`, `start_date`, `end_date`, `category` (Homem/Mulher), `location`, `investment`, `leads`, `platform` (Meta Ads/Google Ads), `campaign_name`, `adset_name`, `created_at`.
* **`creatives`**: `id`, `date`, `campaign`, `adset`, `final_name`, `utm_string`, `ref_code`.
* **`configs`**: `id`, `type` (public/procedure), `name`, `code`.
* **`profiles`**: `id`, `email`, `role`, `created_at` (integrado ao Supabase Auth).

### 4. Arquitetura Serverless no Supabase
* **Webhook do Kommo CRM**: Função **Supabase Edge Function** (`/functions/v1/kommo-webhook`) que recebe os leads em sub-segundo e faz `UPSERT` nativo na tabela `sales`.
* **Sincronização Diária Meta Ads**: Função Edge Function (`/functions/v1/sync-meta-ads`) conectada à Zernio API, acionada automaticamente todo dia via **`pg_cron`** interno do Supabase.
* **Frontend Transparente**: Substituição das chamadas do arquivo [apiService.js](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/src/services/apiService.js) pelo cliente `@supabase/supabase-js`.

---

## 📋 Pendências & Próximos Passos
1. **⏳ Atualização de Status da Consulta (Kommo CRM)**:
   * Implementar a lógica de webhook no Kommo para a etapa de alterar o status da consulta da Coluna K de **"Agendado"** para **"Realizado"**.
2. **Acompanhamento da Rotina Automática**:
   * Monitorar a execução do acionador da Zernio amanhã para validar a entrada autônoma do dia 26/09 na planilha.
3. **Fase de Preparação do Supabase (Novembro/Dezembro 2026)**:
   * Subir o ambiente do Supabase e rodar o script de migração do histórico de 2026 em paralelo, sem desligar a planilha, até a virada de chave para 2027.
