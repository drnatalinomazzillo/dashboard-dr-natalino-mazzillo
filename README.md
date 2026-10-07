# Dashboard Dr. Natalino Mazzillo (Dashboard Próximo Nível®)

Sistema de gestão estratégica, inteligência analítica de vendas, acompanhamento de tráfego pago e insights com Inteligência Artificial desenvolvido para as clínicas e operações do Dr. Natalino Mazzillo.

---

## 🚀 Principais Funcionalidades

### 1. 📊 Análise de Resultados & Funil de Vendas
* **Funil Cascata Global da Operação**:
  * Visão consolidada de ponta a ponta da clínica posicionada acima da evolução temporal (design de alta fidelidade com 4 etapas em cascata: 100%, 95%, 90% e 85% de largura).
  * **Etapa 1 - Leads Totais**: Leads captados, Investimento Real corrigido (+12,15%) e CPL Real $\to$ Chevron com taxa de conversão Lead ➔ Consulta.
  * **Etapa 2 - Consultas Agendadas & Realizadas**: Total de consultas vendidas, CPA Consulta, Taxa de Comparecimento no próprio mês (`statRealizadaNoPeriodo`) e Total Acumulado (`statRealizada`) $\to$ Chevron com conversão Consulta ➔ Procedimento.
  * **Etapa 3 - Procedimentos Válidos**: Vendas líquidas, CPA Procedimento, medição de cancelamentos (% e R$ cancelado) $\to$ Chevron com Ticket Médio.
  * **Etapa 4 - Faturamento Líquido Real**: Faturamento Total expurgado e ROAS Consolidado da Operação.
* **Inteligência de Safra & Maturação Dupla**:
  * **Safra do Mês**: Pacientes cujo lead (Coluna G) ou consulta médica (Coluna M) pertence ao mesmo mês civil do fechamento.
  * **Ciclo Contínuo em Dias**: Faixas objetivas de ciclo rápido ($\le 30$ dias), ciclo médio (31 a 60 dias) e ciclo longo/reativação ($> 60$ dias), permitindo leitura de maturação mesmo em filtros amplos ou anuais.
* **Gestão e Expurgo Rigoroso de Cancelamentos (Coluna K)**:
  * Procedimentos cancelados ou não comparecidos são 100% expurgados da receita líquida, preservando o faturamento real sem inflação.
  * Contabilização dedicada de quantidade, taxa percentual de cancelamento e receita cancelada (R$).
* **Cards de Status Simétricos no Topo**:
  * **Status Consultas**: Realizada (com destaque de quantas foram no próprio mês), Agendada e Cancelada (com eventual valor financeiro cancelado).
  * **Status Procedimentos**: Realizado, Agendado e Cancelado (com exibição do montante negativo expurgado).
* **Matriz de Conversão Cruzada 3x3**: Acompanhamento de leads, consultas (com taxa de comparecimento), procedimentos, ticket médio e ROAS segmentados por unidade (Cabo Frio, Barra da Tijuca, Online) e gênero (Mulher, Homem, Agregado).
* **Gráfico de Evolução Temporal Híbrido (`ComposedChart`)**:
  * **Tráfego em Barras**: Investimento em anúncios plotado na base com calibragem proporcional zero-padding e alíquota fiscal (+12,15%).
  * **Faturamento Prioritário**: Linha de destaque no topo (50% a 95% do gráfico) sem sobreposição visual.
  * **Funil em Múltiplos Eixos**: Leads na faixa intermediária e Consultas/Procedimentos/CPL em eixo secundário sem compressão.
  * **Rótulos Numéricos (`LabelList`)**: Exibição dos valores sobre pontos e barras com botão seletor (*toggle switch*) ON / OFF.
  * **Filtros Dinâmicos**: Seletores por período (mês, ano, personalizado), unidade, tipo e métricas ativáveis individualmente.

### 2. 📢 Gestão de Marketing & Tráfego Pago Automático
* **Automação Diária Meta Ads via Zernio API**:
  * Ingestão autônoma de investimento e conversões diárias sem necessidade de conta de desenvolvedor própria da Meta.
  * Mapeamento de conversões personalizadas (Homem e Mulher/Lipo UHD).
  * Trava anti-duplicação diária na planilha.
* Cálculo automático de impostos fiscais (+12,15%) e CPL real por campanha.
* Exclusão inteligente de campanhas de engajamento/branding no cálculo de leads de conversão direta.

### 3. ⚡ Meta Conversions API (CAPI) & "Botão Mágico" (`meta_capi_sync.gs`)
* **Fluxo de Preparação Semi-Automático**: Menu `⚡ Meta CAPI` na planilha para auditar e preparar apenas vendas selecionadas com o mouse ou recentes (últimos 7 dias).
* **Normalização Estrita na aba `META_COMPRA`**:
  * Event ID padronizado (`COMPRA-YYYYMMDD-NOME-COMPLETO`).
  * Horário ISO com fuso (`YYYY-MM-DDT12:00:00-03:00`).
  * Classificação padrão (`procedimento confirmado` / `consulta confirmada`).
  * Concatenação de Origem + Tag.
* **Dupla Trava Anti-Duplicação**: Coluna de status na planilha + deduplicação nativa por `event_id` nos servidores da Meta.
* **Envio Noturno Automático**: Cron diário via Apps Script para despachar compras pendentes na madrugada.

### 4. 🤝 Integração Kommo CRM
* Webhooks em tempo real com diferenciação automática de funis:
  * **Funil 1 - Consulta** (`pipeline_id: 12121252`)
  * **Funil 2 - Procedimento** (`pipeline_id: 12197743`)
* Dupla trava anti-duplicação (cache temporário + checagem de hash único na Coluna S).
* Tempo de resposta em sub-segundo (< 1s) para evitar retries do CRM.

### 4. 🤖 Análise Inteligente com IA (Gemini 3.5 Flash)
* Diagnóstico operacional e recomendações estratégicas de growth geradas via proxy do Google Apps Script integrado ao Gemini 3.5 Flash.
* Exportação de relatórios executivos em PDF.

### 5. 🎨 Gerador de Criativos & Mídia
* Biblioteca de criativos com métricas de desempenho vinculadas a anúncios.

---

## 🗺️ Roadmap de Modernização 2027 (Migração para Supabase)

Está planejado para o final de 2026 / início de 2027 a evolução da camada de banco de dados e backend:
* **Banco de Dados Relacional**: Migração do Google Sheets para o **Supabase (PostgreSQL)**, reduzindo a latência de consultas para < 100ms e suportando alta concorrência.
* **Carga Histórica de 2026**: Processo ETL para importar 100% dos dados de vendas, marketing e criativos acumulados em 2026 para o PostgreSQL.
* **Arquitetura Serverless**: Webhook do Kommo e rotina da Zernio executadas via **Supabase Edge Functions** e **`pg_cron`**.
* **Autenticação**: Adoção do Supabase Auth oficial (JWT e controle de acesso).

---

## 🛠️ Tecnologias Utilizadas

* **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Phosphor Icons, Marked
* **Backend / Banco de Dados Atual**: Google Apps Script (GAS) integrado a Google Sheets
* **Integrações Externas**: Kommo CRM (Webhooks), Zernio API (Meta Ads Gateway), Gemini 3.5 Flash
* **Hospedagem**: Netlify

---

## 💻 Instalação e Execução Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build
```

---

## 📚 Documentações Técnicas

* [inicio_sessao.md](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/inicio_sessao.md): Histórico cronológico das sessões de desenvolvimento, automações ativas e próximos passos.
* [status-do-projeto.md](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/status-do-projeto.md): Registro detalhado de melhorias, status das integrações e plano de migração para o Supabase.
* [documentacao-integracao-kommo.md](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/documentacao-integracao-kommo.md): Mapeamento de IDs, custom fields e fluxos de webhook do Kommo CRM.
* [nova-integracao-kommo.md](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/nova-integracao-kommo.md): Planejamento e checklist do rastreamento de Leads Orgânicos (Instagram Bio, Indicações) no Kommo e Dashboard.
