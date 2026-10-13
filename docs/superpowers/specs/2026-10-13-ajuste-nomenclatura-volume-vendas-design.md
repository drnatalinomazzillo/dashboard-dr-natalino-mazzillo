# Design: Ajuste de Nomenclatura para "Volume Total de Vendas" e Esclarecimento de Métricas de Maturação

**Data**: 13/10/2026  
**Status**: Aprovado pelo usuário (via seleção interativa)

---

## 1. Contexto & Motivação de Negócio
No modelo operacional e comercial da clínica do Dr. Natalino Mazzillo:
- As **Consultas** costumam ter pagamento antecipado ou no ato do agendamento/comparecimento (faturamento de caixa imediato).
- Já os **Procedimentos Cirúrgicos** representam vendas de contratos fechados de maior valor, onde o paciente fecha a proposta/contrato, mas a liquidação financeira pode envolver parcelamento ou quitação próxima à data cirúrgica.
- Portanto, rotular o montante monetário das vendas líquidas fechadas como "Faturamento Líquido Total" não reflete com precisão a contabilidade de caixa da clínica, sendo muito mais fidedigno o conceito de **Volume de Vendas (Total Vendido / Contratado)**.

Além disso, foi analisada a dúvida sobre o comportamento do funil de **Cabo Frio - Homens (mês anterior: 66 leads, 1 consulta, 2 procedimentos)**: confirmou-se que a venda de procedimentos fechados em um determinado mês frequentemente tem origem em consultas e leads de safras anteriores (ciclo de maturação comercial estendido).

---

## 2. Mudanças de Nomenclatura na Interface

### 2.1 Tela de Resultados (`AnalyticsTab.jsx`)
1. **Card Principal do Topo (KPI Grid)**:
   - De: `Faturamento Líquido Total`
   - Para: `Volume Total de Vendas`
2. **Funil Cascata Global da Operação (Etapa 4)**:
   - De: `4. Faturamento Líquido Real`
   - Para: `4. Volume de Vendas`
3. **Matriz de Conversão Cruzada por Gênero e Unidade (`FunnelCard`)**:
   - De: `4. Faturamento`
   - Para: `4. Volume de Vendas`
4. **Card de Distribuição por Origem**:
   - De: `Faturamento por Origem`
   - Para: `Volume de Vendas por Origem`
5. **Gráfico de Evolução Temporal (`ComposedChart`)**:
   - Subtítulo: `Tráfego em barras na base (R$) • Volume de Vendas no topo (R$) • Funil de Vendas em linhas`
   - Seletor / Botão de exibição da linha: `Volume de Vendas`
   - Tooltip e série de dados: `'Volume de Vendas'`

### 2.2 Simulador de Metas (`SimulatorTab.jsx`)
- Etapa 4:
  - De: `4. Faturamento Estimado`
  - Para: `4. Volume de Vendas Estimado`

### 2.3 Serviços de Suporte (IA e PDF)
- Ajustar labels geradas no resumo executivo do `pdfService.js` e contextos de IA em `geminiService.js` para utilizar `Volume Total de Vendas` em vez de `Faturamento Total`.

---

## 3. Explicação Técnica do Caso Cabo Frio (Homens)
- **Leads**: 66 leads gerados pelas campanhas de tráfego do período filtrado.
- **Consultas**: 1 consulta com data de venda (`s.date`) dentro do período filtrado.
- **Procedimentos**: 2 procedimentos com data de fechamento/venda (`s.date`) dentro do período filtrado.
- **Por que procedimentos > consultas no mesmo período?**:
  O filtro do dashboard seleciona os registros pela **Data da Venda (`sale.date`)**. Quando um paciente realiza a consulta médica no mês de Agosto (ou Julho) e decide assinar o contrato da cirurgia em Setembro, a data da venda do procedimento fica registrada em Setembro. Por isso, a quantidade de procedimentos fechados em um mês pode ser maior do que as consultas agendadas naquele mesmo mês. O recurso recente de **"Safra & Maturação" / "Da Consulta à Venda"** no dashboard foi desenvolvido exatamente para auditar quantos dias se passaram entre a consulta e a venda (≤ 30 dias, 31-60 dias ou +60 dias de maturação).
