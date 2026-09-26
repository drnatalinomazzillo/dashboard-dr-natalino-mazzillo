# Design Spec: Adição de Investimento em Tráfego e Quantidade de Leads no Gráfico de Evolução Temporal

- **Data**: 2026-09-26
- **Status**: Aprovado
- **Arquivo Alvo**: `src/components/analytics/AnalyticsTab.jsx`

---

## 1. Objetivo
Adicionar as métricas de **Investimento em Tráfego** (R$) e **Quantidade de Leads** (inteiro) ao gráfico temporal da tela de Resultados/Analytics, com controles estilo pílula/badge no topo do card permitindo ligar e desligar qualquer uma das 5 métricas dinamicamente.

---

## 2. Dados (`generateEvolutionData`)
- Modificar o retorno da função `generateEvolutionData`:
  ```javascript
  return data.map(d => ({
      label: formatLabel(d.key),
      CPL: d.leads > 0 ? d.invest / d.leads : 0,
      Consultas: d.consultas,
      Faturamento: d.faturamento,
      Investimento: parseFloat(d.invest.toFixed(2)),
      Leads: Math.round(d.leads)
  }));
  ```

---

## 3. Estado dos Controles de Exibição
- Adicionar estado em `AnalyticsTab`:
  ```javascript
  const [visibleLines, setVisibleLines] = useState({
      faturamento: true,
      investimento: true,
      leads: true,
      cpl: true,
      consultas: true
  });
  ```
- Criar toggle handler para alternar `visibleLines[key]`.

---

## 4. Interface (UI)
- Acima do gráfico, inserir barra de chips interativos com visual glassmorphism:
  - **Faturamento**: `#34d399` (Verde Esmeralda)
  - **Investimento**: `#38bdf8` (Azul Claro)
  - **Leads**: `#fbbf24` (Âmbar / Amarelo)
  - **CPL**: `#818cf8` (Índigo)
  - **Consultas**: `#f472b6` (Rosa)
- Atualizar título do card para: `"Evolução Temporal: Tráfego e Vendas"`.

---

## 5. Gráfico (`LineChart` Recharts)
- Eixo Esquerdo (`yAxisId="left"`):
  - `Leads` (se `visibleLines.leads` ativo)
  - `Consultas` (se `visibleLines.consultas` ativo)
  - `CPL` (se `visibleLines.cpl` ativo)
- Eixo Direito (`yAxisId="right"`):
  - `Faturamento` (se `visibleLines.faturamento` ativo)
  - `Investimento` (se `visibleLines.investimento` ativo)
- Tooltip com formatação condicional para moeda (`Faturamento`, `Investimento`, `CPL`) e inteiro (`Leads`, `Consultas`).
