import { API_URL } from '../config/api';

/**
 * Chama o Gemini via proxy no Apps Script
 */
export async function callGemini(promptText) {
    const url = new URL(API_URL);
    url.searchParams.append("action", "gemini");
    url.searchParams.append("prompt", promptText);

    const response = await fetch(url.toString(), { method: 'POST' });
    const data = await response.json();

    if (data.success) {
        return data.text;
    } else {
        console.error("Erro Gemini Proxy:", data.error);
        throw new Error(data.error || "Erro ao conectar com a IA");
    }
}

/**
 * Gera ideias criativas para anúncios
 */
export async function generateCreativeIdeas(pubName, procName) {
    const prompt = `Atue como um especialista em Copywriting para anúncios de estética.
Eu preciso de 5 ideias de nomes criativos (curtos e chamativos) para uma campanha de anúncios.

Público Alvo: ${pubName}
Procedimento: ${procName}

Gere uma lista formatada em Markdown com 5 opções. Para cada opção, dê uma breve explicação de 1 linha do porquê funciona.`;

    return callGemini(prompt);
}

/**
 * Gera análise estratégica com IA baseada nas métricas do dashboard
 */
export async function analyzeDataWithAI(metrics) {
    const m = metrics;
    const fmt = (v) => v != null ? v.toFixed(2) : 'N/D';

    const prompt = `
Você está analisando **exclusivamente os dados do período filtrado pelo usuário**.

📅 Período analisado: **${m.period}**

Você é um Estrategista de Growth, Marketing, Vendas e Performance Sênior, especialista em clínicas de cirurgia plástica e serviços de alto valor.

Todos os dados abaixo são reais, consolidados e confiáveis.

---

## 📊 VISÃO FINANCEIRA
- Faturamento Total: **R$ ${fmt(m.faturamentoTotal)}**
- Investimento Total em Marketing: **R$ ${fmt(m.investimentoTotal)}**
- ROAS Consulta: **${m.roasConsulta !== null ? m.roasConsulta + 'x' : 'N/D'}**
- ROAS Procedimento: **${m.roasProcedimento !== null ? m.roasProcedimento + 'x' : 'N/D'}**

---

## 📥 AQUISIÇÃO E CAMPANHAS
- Total de Leads: **${m.totalLeads}**
- CPL Médio Geral: **R$ ${m.cplMedio !== null ? fmt(m.cplMedio) : 'N/D'}**
- Campanhas de Vendas/Leads (Direto):
  - Investimento Real: **R$ ${fmt(m.vendasInvestReal)}**
  - Leads: **${m.vendasLeadsCount}**
  - CPL Vendas: **R$ ${fmt(m.vendasCpl)}**
- Campanhas de Engajamento/Branding (Marca):
  - Investimento Real: **R$ ${fmt(m.engajamentoInvestReal)}**
  - Leads: **${m.engajamentoLeadsCount}**
  - CPL Engajamento: **R$ ${fmt(m.engajamentoCpl)}**
- Demográficos e Localização de Leads:
  - Mulheres: **${m.leadsMulher} leads** | Homens: **${m.leadsHomem} leads**
  - Rio de Janeiro (Barra/RJ): **${m.leadsRJ} leads** | Cabo Frio (CF): **${m.leadsCF} leads**
- Funil de Vendas Segmentado (Conversão Cruzada Gênero + Local):
  - Cabo Frio (CF):
    - Mulheres: **${m.leadsCF_Mulher} leads** (Investido Real: R$ ${fmt(m.investRealCF_Mulher)} | CPL: R$ ${fmt(m.cplCF_Mulher)}) ➔ **${m.conCF_Mulher} consultas agendadas** (Fat. Consulta: R$ ${fmt(m.revenueConCF_Mulher)} | ${m.realConCF_Mulher} realizadas) ➔ **${m.procCF_Mulher} procedimentos vendidos**
    - Homens: **${m.leadsCF_Homem} leads** (Investido Real: R$ ${fmt(m.investRealCF_Homem)} | CPL: R$ ${fmt(m.cplCF_Homem)}) ➔ **${m.conCF_Homem} consultas agendadas** (Fat. Consulta: R$ ${fmt(m.revenueConCF_Homem)} | ${m.realConCF_Homem} realizadas) ➔ **${m.procCF_Homem} procedimentos vendidos**
  - Barra da Tijuca (Barra/RJ):
    - Mulheres: **${m.leadsRJ_Mulher} leads** (Investido Real: R$ ${fmt(m.investRealRJ_Mulher)} | CPL: R$ ${fmt(m.cplRJ_Mulher)}) ➔ **${m.conRJ_Mulher} consultas agendadas** (Fat. Consulta: R$ ${fmt(m.revenueConRJ_Mulher)} | ${m.realConRJ_Mulher} realizadas) ➔ **${m.procRJ_Mulher} procedimentos vendidos**
    - Homens: **${m.leadsRJ_Homem} leads** (Investido Real: R$ ${fmt(m.investRealRJ_Homem)} | CPL: R$ ${fmt(m.cplRJ_Homem)}) ➔ **${m.conRJ_Homem} consultas agendadas** (Fat. Consulta: R$ ${fmt(m.revenueConRJ_Homem)} | ${m.realConRJ_Homem} realizadas) ➔ **${m.procRJ_Homem} procedimentos vendidos**
  - Consultas Online:
    - Mulheres: **${m.conOnline_Mulher} agendadas** (Fat. Consulta: R$ ${fmt(m.revenueConOnline_Mulher)} | ${m.realConOnline_Mulher} realizadas)
    - Homens: **${m.conOnline_Homem} agendadas** (Fat. Consulta: R$ ${fmt(m.revenueConOnline_Homem)} | ${m.realConOnline_Homem} realizadas)

---

## 📞 FUNIL DE CONSULTA
- Consultas Vendidas: **${m.consultasVendidas}**
- CPA da Consulta: **R$ ${m.cpaConsulta !== null ? fmt(m.cpaConsulta) : 'N/D'}**
- Leads por Consulta: **${m.leadsPorConsulta !== null ? m.leadsPorConsulta : 'N/D'}**
- Tempo Médio de Fechamento da Consulta: **${m.tempoMedioConsultaDias !== null ? m.tempoMedioConsultaDias + ' dias' : 'N/D'}**

---

## 💉 FUNIL DE PROCEDIMENTO
- Procedimentos Vendidos: **${m.procedimentosVendidos}**
- CPA do Procedimento: **R$ ${m.cpaProcedimento !== null ? fmt(m.cpaProcedimento) : 'N/D'}**
- Consultas por Procedimento: **${m.consultasPorProcedimento !== null ? m.consultasPorProcedimento : 'N/D'}**
- Ticket Médio do Procedimento: **R$ ${m.ticketMedioProcedimento !== null ? fmt(m.ticketMedioProcedimento) : 'N/D'}**
- Tempo Médio de Fechamento do Procedimento: **${m.tempoMedioProcedimentoDias !== null ? m.tempoMedioProcedimentoDias + ' dias' : 'N/D'}**

---

## 🎯 ANÁLISE OBRIGATÓRIA
0. Faça um breve resumo sobre o momento do Negócio.
1. Identifique onde o investimento está retornando mais dinheiro e se a distribuição entre campanhas de Vendas/Leads e Engajamento/Branding está equilibrada e eficiente.
2. Identifique exatamente onde o funil está travando.
3. Determine se o gargalo é **tráfego, conversão ou fechamento**.
4. Aponte **a métrica mais crítica** para otimização imediata.
5. Liste **3 ações práticas, objetivas e executáveis para os próximos 7 dias**.

### Diretrizes de resposta:
- Use Markdown
- Seja direto e estratégico
- NÃO diga que faltam métricas se os valores estiverem presentes
- Trate N/D apenas como ausência real
`;

    return callGemini(prompt);
}
