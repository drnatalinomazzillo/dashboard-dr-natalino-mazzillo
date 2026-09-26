# Gráfico de Evolução Temporal: Investimento e Leads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar linhas de Investimento em Tráfego e Quantidade de Leads ao gráfico de Evolução Temporal na aba de Resultados (Analytics), com controles interativos de exibição (pills) para cada uma das 5 métricas.

**Architecture:** Modificação focada em `src/components/analytics/AnalyticsTab.jsx`: enriquecimento do payload retornado por `generateEvolutionData`, adição de estado e controles UI em badges/pílulas modernos acima do gráfico, e configuração dinâmica de linhas e eixos do `LineChart` do Recharts com tooltips customizados.

**Tech Stack:** React 19, Recharts, TailwindCSS / Phosphor Icons.

## Global Constraints
- Manter integridade de todas as outras métricas e funcionalidades da aba de resultados.
- Preservar o design system moderno escuro/glassmorphism do dashboard.
- Todos os 5 filtros ativos por padrão; usuário pode ligar/desligar qualquer um com um clique.

---

### Task 1: Atualizar geração de dados (`generateEvolutionData`)

**Files:**
- Modify: `src/components/analytics/AnalyticsTab.jsx:145-155`

**Interfaces:**
- Produces: Objetos no array `evolutionData` contendo `{ label, CPL, Consultas, Faturamento, Investimento, Leads }`.

- [ ] **Step 1: Atualizar retorno de `generateEvolutionData`**
Incluir `Investimento` e `Leads` no mapeamento final do array de dados.

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

### Task 2: Adicionar estado de controle e barra de pílulas/chips no componente

**Files:**
- Modify: `src/components/analytics/AnalyticsTab.jsx:250-260` e `800-840`

**Interfaces:**
- Produces: Estado `visibleLines` e função `toggleLine(key)` para controlar quais linhas do gráfico são desenhadas.

- [ ] **Step 1: Adicionar estado `visibleLines`**
Adicionar estado no corpo do componente `AnalyticsTab`:
```javascript
    const [visibleLines, setVisibleLines] = useState({
        faturamento: true,
        investimento: true,
        leads: true,
        cpl: true,
        consultas: true
    });
    const toggleLine = (key) => setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
```

- [ ] **Step 2: Renderizar barra de pílulas no cabeçalho do gráfico e configurar `LineChart`**
Renderizar os controles de pílula acima do gráfico e conectar as linhas do Recharts ao estado `visibleLines`.
Atualizar o título para "Evolução Temporal: Tráfego e Vendas".
Atualizar o Tooltip para formatar `Investimento` em moeda e `Leads` como número inteiro.

---

### Task 3: Validação visual e de build

**Files:**
- Test via: `npm run build`

- [ ] **Step 1: Executar build para garantir ausência de erros de sintaxe**
Run: `npm run build`
Expected: Build concluído com sucesso sem erros.
