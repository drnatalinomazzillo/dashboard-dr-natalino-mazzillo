# Documento de Contexto do Projeto: DASH NATALINO (Dashboard Próximo Nível®)

## 📌 Sobre o Projeto
O **Dashboard Próximo Nível®** é um aplicativo web focado em métricas financeiras, gestão de funil de vendas (Kommo CRM), acompanhamento de investimentos em marketing (Meta Ads e Google Ads) e gerador de criativos com Inteligência Artificial, desenvolvido sob medida para a clínica e operações do Dr. Natalino Mazzillo.

Sua arquitetura fullstack atual combina um frontend moderno em **React + Vite + Tailwind CSS** com backend e banco de dados centralizados no **Google Apps Script**, consumindo e sincronizando dados da planilha oficial ("Vendas", "Marketing", etc.) e webhooks do Kommo CRM.

---

## 🛠️ O que foi realizado na sessão atual (26/09/2026)

### 1. Reformulação Completa do Gráfico de Evolução Temporal (`AnalyticsTab.jsx`)
* **Transição para `ComposedChart`**: Substituição de gráfico simples de linhas por um gráfico híbrido avançado (`ComposedChart` do Recharts), unificando barras e linhas no mesmo plano sem sobreposição indevida.
* **Tráfego em Barras na Base**: O investimento em marketing agora é exibido como barras sutis (`maxBarSize={30}`) com zero-padding no eixo inferior (`[0, maxInvest * 2.2]`), mantendo proporções visuais perfeitas (ex: R$ 5k aparenta exatamente 1/3 de R$ 15k).
* **Faturamento no Topo**: A linha de receita ocupa a zona nobre superior (50% a 95% da altura), impedindo que barras ou linhas de tráfego fiquem acima do faturamento.
* **Funil de Conversão Calibrado em Zonas**:
  - *Leads*: Faixa intermediária (30% a 53%).
  - *Consultas e Procedimentos*: Eixo secundário dedicado (`yAxisId="funnelSub"`), permitindo ondulações visíveis sem achatamento contra a base.
* **Rótulos Numéricos (`LabelList`) com Chavinha Interativa (Toggle ON/OFF)**:
  - Implementação de `<LabelList>` coloridos e formatados em todas as séries do gráfico.
  - Botão seletor tátil estilo iOS no cabeçalho do painel ("Rótulos no Gráfico: ON / OFF") para alternar entre uma leitura detalhada e um visual limpo.
* **Ajuste de Impostos no Tráfego (+12,15%)**: Incorporação da alíquota fiscal no gráfico temporal, alinhando com exatidão aos cards de visão geral do Marketing.

### 2. Automação da Ingestão de Anúncios Meta Ads via Zernio API (`ImportacaoMeta.gs.gs`)
* **Superação do Bloqueio de Desenvolvedor da Meta**: Conexão estabelecida com a **Zernio API** (provedor homologado pela Meta), dispensando a necessidade de conta de desenvolvedor própria ou revisão de app na Meta.
* **Carga Retroativa do Período Pendente (21/09 a 25/09)**:
  - Validação de 100% de paridade contra a planilha manual histórica (conferência do dia 15/09 bateu centavo por centavo e lead por lead).
  - Execução bem-sucedida da função `importarPendentes21a25`: **50 linhas inseridas** (10 conjuntos/dia), somando **R$ 3.010,24** de investimento bruto e **78 leads** no período.
* **Piloto Automático Diário Configurado**:
  - Acionador do Apps Script vinculado à função `importarDadosOntemAutomatico`, agendado para rodar toda madrugada (05h00 às 06h00) na nuvem do Google.
  - Trava anti-duplicação (`removerLinhasDaData`) ativa para garantir que reexecuções nunca dupliquem registros.

### 3. Integração Meta Conversions API (CAPI) & "Botão Mágico" (`meta_capi_sync.gs`)
* **Fluxo Seguro com "Botão Mágico" no Sheets (`⚡ Meta CAPI`)**:
  - Função `prepararVendasSelecionadas`: O gestor audita as vendas conferidas na aba `Vendas`, seleciona as linhas com o mouse e executa.
  - Normalização completa para a aba `META_COMPRA` com colunas de envio (O, P, Q) limpas.
  - Mapeamento estrito:
    - Data/Hora ISO com fuso (`YYYY-MM-DDT12:00:00-03:00`).
    - Event ID padronizado: `COMPRA-YYYYMMDD-PRIMEIRO-SEGUNDO-SOBRENOMES` (sem acentos, maiúsculo, hifens).
    - Coluna C e Coluna I deixadas vazias por especificação da clínica.
    - Tipo normalizado em `'procedimento confirmado'` ou `'consulta confirmada'`.
    - Origem concatenada com a Tag completa (ex: `Tráfego Pago (Ref: ...)`, `Reativação Cliente (Lead Antigo) ORGÂNICO`).
* **Proteção Anti-Duplicação em Múltiplas Camadas**:
  - Trava da Planilha: Coluna O com `TRUE` ignora o evento de imediato.
  - Trava da Meta: O `event_id` único faz o descarte automático de duplicidades na API da Meta.
  - Trava de Concorrência: `LockService` no Apps Script.
* **Envio Noturno Automatizado (Cron)**:
  - Função `executarSyncNoturnoMetaCapi` pronta para rodar diariamente via acionador no Apps Script (03h00 às 04h00), enviando todas as compras preparadas com hash SHA-256 e gravando recibos de resposta da Meta.

---

## 🗺️ Planejamento Estratégico: Migração para Supabase (Meta 2027)

Foi definida a estratégia para migrar a camada de persistência e backend de **Google Sheets + Apps Script** para **Supabase (PostgreSQL)** nos próximos meses, visando iniciar 2027 com infraestrutura robusta, rápida e profissional.

### Pilares da Migração:
1. **Performance e Estabilidade**: Redução do tempo de carregamento de ~3.5s para menos de 100ms, com suporte a concorrência sem risco de travamentos de planilha (`LockService`).
2. **Importação do Histórico de 2026**:
   - Criação de rotina/script de migração ETL para extrair todas as linhas das abas "Vendas", "Marketing" e "Criativos" do Google Drive para o PostgreSQL, garantindo continuidade e integridade histórica total para análises comparativas em 2027.
3. **Webhooks e Automações Serverless (Supabase Edge Functions)**:
   - Webhook do Kommo CRM migrado para Edge Function em TypeScript com constraints `UNIQUE` nativas no Postgres para anti-duplicação.
   - Rotina diária de ingestão da Zernio (Meta Ads) agendada via `pg_cron` nativo do Supabase.
4. **Segurança & Autenticação**:
   - Transição do login da aba "Admin" para o **Supabase Auth** oficial (JWT, sessões seguras e senhas com hash).

---

## 🚀 Próximos Passos

1. **Monitoramento do Piloto Automático**:
   - Acompanhar a execução matinal automática do dia 26/09 entrando na planilha sem intervenção manual.
2. **Webhook de Status da Consulta (Kommo CRM)**:
   - Implementar a atualização automática da Coluna K de "Agendado" para "Realizado" via webhook.
3. **Início da Preparação do Supabase (Q4/2026)**:
   - Criar o projeto no Supabase, desenhar o schema SQL das tabelas (`sales`, `marketing`, `creatives`, `configs`) e criar o script de importação do histórico de 2026.
