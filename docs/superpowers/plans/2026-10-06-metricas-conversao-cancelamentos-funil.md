# Plano de Implementação: Taxas de Comparecimento, Status & Valor de Procedimentos Cancelados e Funil Cascata Global

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar este plano tarefa a tarefa. Passos usam sintaxe de checkbox (`- [ ]`) para acompanhamento.

**Goal:** Implementar o expurgo de faturamento e medição financeira de procedimentos cancelados, exibir taxas percentuais de status nos KPIs e cards da matriz, e adicionar o funil cascata global de conversão da operação acima da evolução temporal (design inspirado no Simulador).

**Architecture:** Modificação centralizada no utilitário de inteligência de negócios `src/utils/calculations.js` para cálculo de status, percentuais e deduções fiscais/cancelamentos, seguida da integração dos dados na camada de apresentação `src/components/analytics/AnalyticsTab.jsx`.

**Tech Stack:** React 18, Vite, Tailwind CSS, Recharts, Phosphor Icons.

## Global Constraints
- Procedimentos com status Cancelado na Coluna K nunca somam no Faturamento Total, diário ou segmentado.
- Os cards de Ciclos (Lead $\to$ Consulta, Lead $\to$ Procedimento, Consulta $\to$ Procedimento) devem permanecer exatamente na sequência atual.
- O funil cascata global deve reutilizar a linguagem visual de largura decrescente (100% $\to$ 95% $\to$ 90% $\to$ 85%) com faixas laterais e badges chevron definida em `SimulatorTab.jsx`.
- Preservar retrocompatibilidade com todas as funções auxiliares de exportação em PDF e diagnóstico por IA.

---

### Task 1: Regras de Negócio e Cálculos em `src/utils/calculations.js`

**Files:**
- Modify: `src/utils/calculations.js:30-170` e `src/utils/calculations.js:220-255`

**Interfaces:**
- Consumes: `filteredSales` (array de vendas com campos `status`, `value`, `type`, `location`, `gender`), `marketingData`.
- Produces: `statProcCancelada`, `statProcRealizada`, `statProcAgendada`, `cProTotal`, `cPro` (líquido), `revenueProcCancelado`, `taxaProcCancelamento`, `taxaProcRealizado`, `taxaProcAgendado`, `taxaConRealizada`, `taxaConAgendada`, `taxaConCancelada`.

- [ ] **Step 1: Implementar contadores e expurgo de cancelamentos em `src/utils/calculations.js`**
  - Adicionar variáveis de contagem e receita cancelada:
    ```javascript
    let statProcRealizada = 0, statProcAgendada = 0, statProcCancelada = 0;
    let revenueProcCancelado = 0;
    let cProTotal = 0;
    ```
  - Na iteração de `filteredSales`:
    ```javascript
    const st = (s.status || '').toLowerCase();
    const isCancelado = st.includes('cancelad') || st.includes('não compareceu');
    const isRealizado = st.includes('realizado') || st.includes('realizada');
    const isAgendado = st.includes('agendad') || st.includes('a agendar');
    ```
  - Para `s.type !== 'Consulta'` (Procedimento):
    - `cProTotal++;`
    - Se `isCancelado`:
      - `statProcCancelada++;`
      - `revenueProcCancelado += s.value;`
      - **NÃO somar** em `total`, `totalProcedimento`, `dailyRevenue[dateKey]`, nem em receitas por local/gênero.
    - Se `!isCancelado`:
      - `cPro++;`
      - `totalProcedimento += s.value;`
      - `total += s.value;`
      - `dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + s.value;`
      - Se `isRealizado`: `statProcRealizada++;`
      - Senão se `isAgendado`: `statProcAgendada++;`
      - Somar nas variáveis de receita segmentada (`revenueProcCF_Mulher`, etc.).
  - Calcular taxas percentuais de Procedimento e Consulta:
    ```javascript
    const taxaProcCancelamento = cProTotal > 0 ? ((statProcCancelada / cProTotal) * 100).toFixed(1) : '0';
    const taxaProcRealizado = cProTotal > 0 ? ((statProcRealizada / cProTotal) * 100).toFixed(1) : '0';
    const taxaProcAgendado = cProTotal > 0 ? ((statProcAgendada / cProTotal) * 100).toFixed(1) : '0';

    const taxaConRealizada = cCon > 0 ? ((statRealizada / cCon) * 100).toFixed(1) : '0';
    const taxaConAgendada = cCon > 0 ? ((statAgendada / cCon) * 100).toFixed(1) : '0';
    const taxaConCancelada = cCon > 0 ? ((statCancelada / cCon) * 100).toFixed(1) : '0';
    ```
  - Exportar todas as novas métricas no objeto retornado por `calculateMetrics`.

- [ ] **Step 2: Verificar compilação com `npm run build`**
  Run: `npm run build`
  Expected: Build concluído com sucesso (`built in Xs`).

- [ ] **Step 3: Commit das alterações do utilitário de cálculo**
  ```bash
  git add src/utils/calculations.js
  git commit -m "feat(calculations): expurgar faturamento de procedimentos cancelados e adicionar metricas de status"
  ```

---

### Task 2: Reorganização dos KPIs do Topo em `src/components/analytics/AnalyticsTab.jsx`

**Files:**
- Modify: `src/components/analytics/AnalyticsTab.jsx:542-610`

**Interfaces:**
- Consumes: Novas propriedades de `metrics` (`statProcRealizada`, `statProcAgendada`, `statProcCancelada`, `revenueProcCancelado`, `taxaProcCancelamento`, `taxaConRealizada`, etc.).
- Produces: Grade de KPIs superior harmonizada, preservando o bloco de ciclos sequencial.

- [ ] **Step 1: Atualizar Card "Status Consultas" com percentuais**
  - Exibir ao lado de cada quantidade a porcentagem sobre o total de consultas vendidas:
    - Realizada: `{metrics.statRealizada} ({metrics.taxaConRealizada}%)`
    - Agendada: `{metrics.statAgendada} ({metrics.taxaConAgendada}%)`
    - Cancelada: `{metrics.statCancelada} ({metrics.taxaConCancelada}%)`

- [ ] **Step 2: Adicionar Card "Status Procedimentos" e Destaque Financeiro de Cancelados**
  - Criar o card estilizado com borda esmeralda/verde:
    - Realizado: `{metrics.statProcRealizada} ({metrics.taxaProcRealizado}%)`
    - Agendado: `{metrics.statProcAgendada} ({metrics.taxaProcAgendado}%)`
    - Cancelado: `{metrics.statProcCancelada} ({metrics.taxaProcCancelamento}%)`
  - Incluir linha ou pill de alerta com o **Valor Financeiro Cancelado**:
    - `Valor Cancelado: {formatCurrency(metrics.revenueProcCancelado)}`

- [ ] **Step 3: Manter a sequência exata dos 3 cards de Ciclo**
  - Preservar os cards `Ciclo (Lead > Consulta)`, `Ciclo (Lead > Procedimento)` e `Consulta > Procedimento` exatamente como estão.

- [ ] **Step 4: Verificar compilação com `npm run build`**
  Run: `npm run build`
  Expected: Build concluído com sucesso.

- [ ] **Step 5: Commit dos novos cards de topo**
  ```bash
  git add src/components/analytics/AnalyticsTab.jsx
  git commit -m "feat(analytics): reorganizar KPIs de topo com status de procedimentos e valor cancelado"
  ```

---

### Task 3: Taxa de Comparecimento de Consultas nos Cards da Matriz 3x3 (`FunnelCard`)

**Files:**
- Modify: `src/components/analytics/AnalyticsTab.jsx:188-235`

**Interfaces:**
- Consumes: `cons`, `realCons` em `FunnelCard`.
- Produces: Rótulo formatado com percentual de realização.

- [ ] **Step 1: Atualizar renderização do bloco de Consultas no `FunnelCard`**
  - Modificar a linha 233 de:
    ```jsx
    <h4 className="text-2xl font-bold text-white font-mono">{cons} <span className="text-xs text-gray-500 font-normal">({realCons} Realiz.)</span></h4>
    ```
    Para:
    ```jsx
    const taxaRealiz = cons > 0 ? ((realCons / cons) * 100).toFixed(1) : '0';
    ...
    <h4 className="text-2xl font-bold text-white font-mono">
        {cons}{' '}
        <span className="text-xs text-gray-500 font-normal">
            ({realCons} Realiz.{cons > 0 ? ` • ${taxaRealiz}%` : ''})
        </span>
    </h4>
    ```

- [ ] **Step 2: Verificar compilação com `npm run build`**
  Run: `npm run build`
  Expected: Build concluído com sucesso.

- [ ] **Step 3: Commit da atualização do `FunnelCard`**
  ```bash
  git add src/components/analytics/AnalyticsTab.jsx
  git commit -m "feat(analytics): adicionar taxa percentual de comparecimento de consultas nos cards do funil"
  ```

---

### Task 4: Funil Cascata Global da Operação (Acima da Evolução Temporal)

**Files:**
- Modify: `src/components/analytics/AnalyticsTab.jsx:840-850`

**Interfaces:**
- Consumes: Métricas agregadas de `metrics` (leads totais, investimento total, CPL, consultas, realizadas, procedimentos válidos, faturamento e ROAS).
- Produces: Novo componente visual de funil em cascata hierárquico posicionado imediatamente antes do cabeçalho de Evolução Temporal.

- [ ] **Step 1: Implementar o bloco do Funil Cascata Global**
  - Posicionar imediatamente acima do container de evolução temporal (`{/* EVOLUTION CHART */}`).
  - Criar o painel glassmorphism com:
    - Cabeçalho:
      ```jsx
      <div className="flex items-center gap-2 mb-6">
          <i className="ph-fill ph-globe text-2xl text-blue-400"></i>
          <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Consolidado Global da Operação (Toda a Clínica)
              </h3>
              <p className="text-xs text-gray-400">
                  Funil real de conversão de ponta a ponta (Mulheres + Homens • Todas as Unidades)
              </p>
          </div>
      </div>
      ```
    - Cascata de 4 etapas:
      - **1. Leads (w-full)**: Azul, total leads, verba total (`formatCurrency(metrics.totalInvestReal)`), CPL médio (`formatCurrency(metrics.cpl)`).
      - Chevron: `↓ Conversão Lead ➔ Consulta: {metrics.convLeadParaConsulta}%`
      - **2. Consultas (w-[95%] mx-auto)**: Roxo, consultas vendidas (`metrics.cCon`), realizadas (`metrics.statRealizada` com `{metrics.taxaConRealizada}%`), CPA Consulta (`formatCurrency(metrics.cpaCon)`).
      - Chevron: `↓ Conversão Consulta ➔ Procedimento: {metrics.convConsultaParaProc}%`
      - **3. Procedimentos (w-[90%] mx-auto)**: Rosa, procedimentos válidos (`metrics.cPro`), cancelados (`metrics.statProcCancelada` com `{metrics.taxaProcCancelamento}%` e `{formatCurrency(metrics.revenueProcCancelado)}`), CPA Procedimento (`formatCurrency(metrics.cpaPro)`).
      - Chevron: `↓ Ticket Médio Real: {formatCurrency(metrics.ticketMedioProc)}`
      - **4. Faturamento (w-[85%] mx-auto)**: Esmeralda, faturamento total líquido (`formatCurrency(metrics.total)`), ROAS Consolidado (`{metrics.roasConsulta ? ... : ...}`), RPL (`formatCurrency(metrics.rpl)`).

- [ ] **Step 2: Verificar integridade no Gráfico de Evolução Temporal (`generateEvolutionData`)**
  - Assegurar que `generateEvolutionData` também exclua procedimentos com status Cancelado tanto da contagem quanto do somatório de faturamento diário.

- [ ] **Step 3: Verificar compilação com `npm run build`**
  Run: `npm run build`
  Expected: Build concluído com sucesso.

- [ ] **Step 4: Commit do Funil Cascata Global**
  ```bash
  git add src/components/analytics/AnalyticsTab.jsx
  git commit -m "feat(analytics): implementar funil cascata global da operacao acima da evolucao temporal"
  ```

---

### Task 5: Validação Final e Homologação

- [ ] **Step 1: Teste de Build Final e Checagem de Erros**
  Run: `npm run build`
  Expected: 0 erros, bundle gerado em `dist/`.

- [ ] **Step 2: Atualização do arquivo `status-do-projeto.md`**
  - Registrar as novas métricas implementadas no relatório de status.
  ```bash
  git add status-do-projeto.md
  git commit -m "docs: atualizar status do projeto com as novas metricas de cancelamento e funil global"
  ```
