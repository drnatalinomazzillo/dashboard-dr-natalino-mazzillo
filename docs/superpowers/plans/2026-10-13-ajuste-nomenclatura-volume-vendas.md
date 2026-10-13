# Ajuste de Nomenclatura para "Volume Total de Vendas" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar toda a nomenclatura de "Faturamento Líquido Total" e "Faturamento" para "Volume Total de Vendas" e "Volume de Vendas" na tela de Resultados, Funil Cascata, Matriz 3x3, Gráficos, Simulador e Relatórios, refletindo com precisão a realidade contratual de procedimentos.

**Architecture:** Modificação das strings de interface em componentes React (`AnalyticsTab.jsx`, `SimulatorTab.jsx`), serviços de exportação/IA (`pdfService.js`, `geminiService.js`), preservando intactas as chaves internas e variáveis matemáticas de dados para manter retrocompatibilidade total com a planilha e webhooks.

**Tech Stack:** React 19, Recharts, Vite, Tailwind CSS v4, Google Apps Script data contracts.

## Global Constraints
- Preservar todas as variáveis internas e chaves de cálculo (ex: `metrics.total`, `Faturamento`, `d.faturamento`, `sourceStats`) para garantir que os cálculos matemáticos e a compatibilidade com a API/planilha continuem 100% funcionais.
- Apenas as labels e textos apresentados ao usuário final na UI e relatórios devem ser alterados.
- Build deve passar com sucesso (`npm run build`).

---

### Task 1: Atualizar Nomenclatura em AnalyticsTab.jsx

**Files:**
- Modify: `src/components/analytics/AnalyticsTab.jsx:260-270`
- Modify: `src/components/analytics/AnalyticsTab.jsx:550-560`
- Modify: `src/components/analytics/AnalyticsTab.jsx:840-870`
- Modify: `src/components/analytics/AnalyticsTab.jsx:1100-1140`
- Modify: `src/components/analytics/AnalyticsTab.jsx:1215-1280`

**Interfaces:**
- Consumes: `FunnelCard`, `metrics.total`, `evolutionData`
- Produces: Textos atualizados na UI de Resultados

- [ ] **Step 1: Atualizar FunnelCard (Matriz 3x3)**
Altere a linha 264 do [AnalyticsTab.jsx](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/src/components/analytics/AnalyticsTab.jsx#L264):
```jsx
<p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">4. Volume de Vendas</p>
```

- [ ] **Step 2: Atualizar Card Principal do Topo**
Altere a linha 554 do [AnalyticsTab.jsx](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/src/components/analytics/AnalyticsTab.jsx#L554):
```jsx
<p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Volume Total de Vendas</p>
```

- [ ] **Step 3: Atualizar Etapa 4 do Funil Cascata Global e Card de Origem**
Altere a linha 846 do [AnalyticsTab.jsx](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/src/components/analytics/AnalyticsTab.jsx#L846):
```jsx
<span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">4. Volume de Vendas</span>
```
E na linha 865:
```jsx
<h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Volume de Vendas por Origem</h4>
```

- [ ] **Step 4: Atualizar Gráfico de Evolução Temporal (ComposedChart)**
Altere o subtítulo na linha 1102:
```jsx
Tráfego em barras na base (R$) • Volume de Vendas no topo (R$) • Funil de Vendas em linhas
```
No array de botões de séries visíveis na linha 1132:
```jsx
{ key: 'faturamento', label: 'Volume de Vendas', color: '#34d399', border: 'border-emerald-500/40', text: 'text-emerald-300', bg: 'bg-emerald-500/15' },
```
No formatter do tooltip (linhas 1220-1222):
```jsx
if (name === 'Faturamento' || name === 'Volume de Vendas') {
    return [formatCurrency(p.Faturamento), 'Volume de Vendas'];
}
```
Na definição da Linha no gráfico (linha 1273):
```jsx
<Line 
    yAxisId="revenue" 
    type="monotone" 
    dataKey="Faturamento" 
    name="Volume de Vendas" 
    stroke="#10b981" 
```

- [ ] **Step 5: Validar compilação**
Run: `npm run build`
Expected: Build concluído com sucesso sem erros sintáticos.

- [ ] **Step 6: Commit**
```bash
git add src/components/analytics/AnalyticsTab.jsx
git commit -m "feat(analytics): atualizar faturamento para Volume Total de Vendas na tela de resultados"
```

---

### Task 2: Atualizar Simulador de Metas e Serviços (PDF e IA)

**Files:**
- Modify: `src/components/simulator/SimulatorTab.jsx:305-312`
- Modify: `src/services/pdfService.js:43-50, 99-105`
- Modify: `src/services/geminiService.js:54-58`

**Interfaces:**
- Consumes: dados de métricas e templates de relatório
- Produces: relatórios e simulação com rótulos consistentes

- [ ] **Step 1: Atualizar Simulador de Metas (SimulatorTab.jsx)**
Na linha 307 de [SimulatorTab.jsx](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/src/components/simulator/SimulatorTab.jsx#L307):
```jsx
<span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">4. Volume de Vendas Estimado</span>
```

- [ ] **Step 2: Atualizar pdfService.js**
Nas linhas 45 e 101 de [pdfService.js](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/src/services/pdfService.js#L45):
```javascript
<td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Volume Total de Vendas</td>
```
e
```javascript
<td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Ticket Médio (Volume de Vendas)</td>
```

- [ ] **Step 3: Atualizar geminiService.js**
Na linha 56 de [geminiService.js](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/src/services/geminiService.js#L56):
```javascript
- Volume Total de Vendas: **R$ ${fmt(m.faturamentoTotal)}**
```

- [ ] **Step 4: Validar build**
Run: `npm run build`
Expected: Build concluído com sucesso.

- [ ] **Step 5: Commit**
```bash
git add src/components/simulator/SimulatorTab.jsx src/services/pdfService.js src/services/geminiService.js
git commit -m "feat: alinhar nomenclatura de Volume de Vendas no simulador, PDF e IA"
```

---

### Task 3: Atualizar Documentação do Projeto e Validação Final

**Files:**
- Modify: `status-do-projeto.md`
- Modify: `inicio_sessao.md`
- Modify: `README.md`

- [ ] **Step 1: Atualizar status-do-projeto.md**
Registrar a sessão de 13/10/2026 com o ajuste da regra contábil/nomenclatura para "Volume Total de Vendas" e o esclarecimento do ciclo de maturação (caso Cabo Frio Homens).

- [ ] **Step 2: Atualizar inicio_sessao.md e README.md**
Atualizar referências em [inicio_sessao.md](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/inicio_sessao.md) e [README.md](file:///d:/DR.%20NATALINO%20MAZZILLO/dashboard-drnatalino-mazzillo/README.md).

- [ ] **Step 3: Executar build final**
Run: `npm run build`
Expected: 0 erros.

- [ ] **Step 4: Commit**
```bash
git add status-do-projeto.md inicio_sessao.md README.md
git commit -m "docs: registrar alteracao de Faturamento para Volume Total de Vendas e analise de maturacao"
```
