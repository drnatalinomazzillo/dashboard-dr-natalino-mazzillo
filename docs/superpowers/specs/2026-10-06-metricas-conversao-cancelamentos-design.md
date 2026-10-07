# Design Spec: Taxas de Comparecimento, Status & Valor de Procedimentos Cancelados, Reorganização de KPIs e Funil Cascata Global

- **Data**: 2026-10-06
- **Status**: Proposta para Aprovação Final
- **Arquivos Alvo**:
  - `src/utils/calculations.js`
  - `src/components/analytics/AnalyticsTab.jsx`

---

## 1. Visão Geral e Alinhamentos Recentes

A partir do feedback por áudio, este documento estabelece as especificações completas para:
1. **Valor (R$) e Volume de Procedimentos Cancelados (Coluna K)**:
   - Medir a quantidade de procedimentos cancelados e o **valor financeiro total cancelado (R$)**.
   - Procedimentos cancelados **não somam no Faturamento Líquido** (`total`, `totalProcedimento`, diário e por unidade).
2. **Redistribuição dos Cards de Topo (Visão Geral de KPIs)**:
   - Manter os cards de **Ciclos (Lead $\to$ Consulta, Lead $\to$ Proc, Consulta $\to$ Proc) sequenciais** exatamente como estão.
   - Reorganizar a grade superior de vendas e status para acomodar:
     - Faturamento Líquido e Ticket Médio;
     - Bloco de Consultas: Vendas Consultas e Status Consultas (com % de Realizadas, Agendadas e Canceladas);
     - Bloco de Procedimentos: Vendas Procedimentos, Status Procedimentos (com % de Realizados, Agendados e Cancelados) e **Card/Métrica de Procedimentos Cancelados (Qtd, % e R$ Cancelado)**.
3. **Taxa de Comparecimento de Consultas nos Cards da Matriz 3x3 (`FunnelCard`)**:
   - `{cons} ({realCons} Realiz. • {taxaRealiz}%)`.
4. **Funil Cascata Global da Operação (Inspirado no Simulador)**:
   - Reaproveitar o design visual de alto impacto já existente em `SimulatorTab.jsx` (funil cascata escalonado: 100% $\to$ 95% $\to$ 90% $\to$ 85% com listras laterais e badges chevron entre as etapas), posicionando-o logo acima do Gráfico de Evolução Temporal com os **dados reais consolidados da clínica**.

---

## 2. Regras de Negócio e Cálculos (`src/utils/calculations.js`)

### 2.1. Procedimentos e Cancelamentos
Na varredura de `filteredSales`:
```javascript
const st = (s.status || '').toLowerCase();
const isCancelado = st.includes('cancelad') || st.includes('não compareceu');
const isRealizado = st.includes('realizado') || st.includes('realizada');
const isAgendado = st.includes('agendad') || st.includes('a agendar');
```
Para `s.type === 'Procedimento'`:
- Contagem bruta: `cProTotal++`
- Se `isCancelado`:
  - `statProcCancelada++`
  - `revenueProcCancelado += s.value` // Valor financeiro perdido em cancelamentos
  - **NÃO soma** em `total`, `totalProcedimento`, `dailyRevenue`, nem nos faturamentos por gênero/unidade.
- Se `!isCancelado`:
  - `cPro++` // Procedimentos válidos/ativos
  - `totalProcedimento += s.value`
  - `total += s.value`
  - `dailyRevenue[dateKey] += s.value`
  - Se `isRealizado`: `statProcRealizada++`
  - Se `isAgendado`: `statProcAgendada++`
  - Soma nas variáveis de receita por unidade e gênero (`revenueProcCF_Mulher`, `revenueProcRJ_Homem`, etc.)

**Métricas derivadas de Procedimento**:
- `taxaProcCancelamento = cProTotal > 0 ? (statProcCancelada / cProTotal) * 100 : 0`
- `taxaProcRealizado = cProTotal > 0 ? (statProcRealizada / cProTotal) * 100 : 0`
- `taxaProcAgendado = cProTotal > 0 ? (statProcAgendada / cProTotal) * 100 : 0`
- `revenueProcCancelado` (R$ financeiro cancelado)

### 2.2. Taxas de Status de Consulta
- `taxaConRealizada = cCon > 0 ? (statRealizada / cCon) * 100 : 0`
- `taxaConAgendada = cCon > 0 ? (statAgendada / cCon) * 100 : 0`
- `taxaConCancelada = cCon > 0 ? (statCancelada / cCon) * 100 : 0`

---

## 3. Interface e Layout (`src/components/analytics/AnalyticsTab.jsx`)

### 3.1. Topo: Reorganização dos Cards de Visão Geral
Manter a harmonia visual em grid responsivo:
- **Card Faturamento Líquido** (Lado esquerdo, destaque com gráfico e Ticket Médio).
- **Grade de Cards de Vendas e Status** (Lado direito):
  - **Consultas**:
    - `Vendas Consultas`: Total (`metrics.cCon`) com detalhamento (Cabo Frio, Barra, Online).
    - `Status Consultas`: Realizada (`statRealizada` e `%`), Agendada (`statAgendada` e `%`), Cancelada (`statCancelada` e `%).
  - **Procedimentos**:
    - `Vendas Procedimentos`: Total Válidos (`metrics.cPro`) com detalhamento (Cabo Frio, Barra).
    - `Status Procedimentos`: Realizado (`statProcRealizada` e `%), Agendado (`statProcAgendada` e `%), Cancelado (`statProcCancelada` e `%).
    - **Destaque de Cancelamentos**: Card dedicado ou sub-bloco exibindo claramente:
      - `Procedimentos Cancelados`: `{statProcCancelada}` (`{taxaProcCancelamento}%`)
      - `Valor Cancelado`: `{formatCurrency(revenueProcCancelado)}`
- **Sequência de Ciclos**: Preservar exatamente a sequência atual com os 3 cards (`Lead > Consulta`, `Lead > Procedimento`, `Consulta > Procedimento`).

### 3.2. Funil Cascata Global (Reaproveitamento do Design do Simulador)
Posicionado imediatamente acima do Gráfico de Evolução Temporal:
- **Container**: `glass-panel p-6 md:p-8 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-purple-950/20 mb-6 shadow-xl`
- **Cabeçalho**:
  - Ícone de foguete/funil (`ph-fill ph-funnel` ou `ph-fill ph-globe`)
  - Título: `CONSOLIDADO GLOBAL DA OPERAÇÃO — TODA A CLÍNICA`
  - Subtítulo: `Funil real de conversão de ponta a ponta (Mulheres + Homens • Todas as Unidades)`
- **Estrutura Cascata**:
  1. **Etapa 1: LEADS (Largura 100%)**
     - Borda esquerda azul (`bg-blue-500`)
     - Esquerda: `1. Leads Totais` • `Investimento Total: {formatCurrency(metrics.totalInvestReal)}` • `CPL Real: {formatCurrency(metrics.cpl)}`
     - Direita: `{metrics.totalLeadsCount} Leads`
  2. **Chevron 1**:
     - Badge centralizada: `↓ Conversão Lead ➔ Consulta: {metrics.convLeadParaConsulta}%`
  3. **Etapa 2: CONSULTAS (Largura 95%)**
     - Borda esquerda roxa (`bg-purple-500`)
     - Esquerda: `2. Consultas Vendidas` • `CPA Consulta: {formatCurrency(cpaCon)}` • `{metrics.statRealizada} Realizadas ({taxaConRealizada}%)`
     - Direita: `{metrics.cCon} Consultas`
  4. **Chevron 2**:
     - Badge centralizada: `↓ Conversão Consulta ➔ Procedimento: {metrics.convConsultaParaProc}%`
  5. **Etapa 3: PROCEDIMENTOS (Largura 90%)**
     - Borda esquerda rosa (`bg-pink-500`)
     - Esquerda: `3. Procedimentos Válidos` • `CPA Procedimento: {formatCurrency(cpaPro)}` • `{metrics.statProcCancelada} Cancelados ({taxaProcCancelamento}%) - {formatCurrency(metrics.revenueProcCancelado)}`
     - Direita: `{metrics.cPro} Vendas`
  6. **Chevron 3**:
     - Badge centralizada: `↓ Ticket Médio Real: {formatCurrency(metrics.ticketMedioProc)}`
  7. **Etapa 4: FATURAMENTO (Largura 85%)**
     - Borda esquerda esmeralda (`bg-emerald-500`)
     - Esquerda: `4. Faturamento Líquido` • `ROAS Consolidado: {roas}x`
     - Direita: `{formatCurrency(metrics.total)}`

### 3.3. Matriz 3x3 Existente (`FunnelCard`)
- Adição da porcentagem de realização de consulta:
  `{cons} ({realCons} Realiz. • {((realCons / cons) * 100).toFixed(1)}%)`

---

## 4. Validação
1. Validar que vendas de procedimentos marcadas como "Cancelado" não somam no faturamento total nem na série temporal.
2. Conferir que o valor financeiro dos procedimentos cancelados (`revenueProcCancelado`) é exibido com precisão.
3. Testar a responsividade do layout em mobile e desktop para garantir alinhamento perfeito.
