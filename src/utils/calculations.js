/**
 * Calcula todas as métricas do dashboard a partir de vendas filtradas e dados de marketing
 */
export function calculateMetrics(filteredSales, marketingData, periodLabel) {
    let total = 0, totalConsulta = 0, totalProcedimento = 0, cCon = 0, cPro = 0;
    let grouped = {}, sourceStats = {};
    let timesConsulta = [], timesProc = [], timesConsToProc = [];
    let conCF = 0, conBarra = 0, conOnline = 0;
    let procCF = 0, procBarra = 0;
    let dailyRevenue = {};
    let statRealizada = 0, statAgendada = 0, statCancelada = 0;
    let statProcRealizada = 0, statProcAgendada = 0, statProcCancelada = 0;
    let revenueProcCancelado = 0;
    let revenueConCancelado = 0;
    let cProTotal = 0;

    // Métricas de Safra / Cohort (Áudio 2 e 3)
    let conCohortMes = 0, conCohort30 = 0, conCohort60 = 0, conCohortSemData = 0;
    let procConsCohortMes = 0, procConsCohort30 = 0, procConsCohort60 = 0, procConsCohortSemData = 0;
    let procLeadCohortMes = 0, procLeadCohort30 = 0, procLeadCohort60 = 0, procLeadCohortSemData = 0;

    // Segmentações por gênero e local
    let conRJ_Mulher = 0, realConRJ_Mulher = 0, procRJ_Mulher = 0;
    let conRJ_Homem = 0, realConRJ_Homem = 0, procRJ_Homem = 0;
    let conCF_Mulher = 0, realConCF_Mulher = 0, procCF_Mulher = 0;
    let conCF_Homem = 0, realConCF_Homem = 0, procCF_Homem = 0;
    let conOnline_Mulher = 0, realConOnline_Mulher = 0;
    let conOnline_Homem = 0, realConOnline_Homem = 0;

    let revenueConRJ_Mulher = 0, revenueConRJ_Homem = 0;
    let revenueConCF_Mulher = 0, revenueConCF_Homem = 0;
    let revenueConOnline_Mulher = 0, revenueConOnline_Homem = 0;

    let revenueProcRJ_Mulher = 0, revenueProcRJ_Homem = 0;
    let revenueProcCF_Mulher = 0, revenueProcCF_Homem = 0;
    let revenueProcOnline_Mulher = 0, revenueProcOnline_Homem = 0;
    let procOnline_Mulher = 0, procOnline_Homem = 0;

    filteredSales.forEach(s => {
        const genderNorm = (s.gender || '').trim().toLowerCase();
        const isMulher = genderNorm === 'mulher';
        const isHomem = genderNorm === 'homem';

        const st = (s.status || '').toLowerCase();
        const isCancelado = st.includes('cancelad') || st.includes('não compareceu');
        const isRealizada = st.includes('realizado') || st.includes('realizada');
        const isAgendada = st.includes('agendad') || st.includes('a agendar');

        let dateKey = s.date.substring(0, 10);

        if (s.type === 'Consulta') {
            cCon++;
            if (isCancelado) {
                statCancelada++;
                revenueConCancelado += (Number(s.value) || 0);
            } else {
                totalConsulta += s.value;
                total += s.value;
                dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + s.value;
                if (!sourceStats[s.source]) sourceStats[s.source] = 0;
                sourceStats[s.source] += s.value;

                if (isRealizada) statRealizada++;
                else if (isAgendada) statAgendada++;
                else statRealizada++;

                if (s.location === 'Cabo Frio') conCF++;
                else if (s.location === 'Barra da Tijuca') conBarra++;
                else if (s.location === 'Online') conOnline++;

                // Mapeia para a segmentação por gênero e unidade
                if (s.location === 'Cabo Frio') {
                    if (isMulher) { conCF_Mulher++; if (isRealizada) realConCF_Mulher++; revenueConCF_Mulher += s.value; }
                    else if (isHomem) { conCF_Homem++; if (isRealizada) realConCF_Homem++; revenueConCF_Homem += s.value; }
                } else if (s.location === 'Barra da Tijuca') {
                    if (isMulher) { conRJ_Mulher++; if (isRealizada) realConRJ_Mulher++; revenueConRJ_Mulher += s.value; }
                    else if (isHomem) { conRJ_Homem++; if (isRealizada) realConRJ_Homem++; revenueConRJ_Homem += s.value; }
                } else if (s.location === 'Online') {
                    if (isMulher) { conOnline_Mulher++; if (isRealizada) realConOnline_Mulher++; revenueConOnline_Mulher += s.value; }
                    else if (isHomem) { conOnline_Homem++; if (isRealizada) realConOnline_Homem++; revenueConOnline_Homem += s.value; }
                }
            }
        } else {
            // Procedimento
            cProTotal++;
            if (isCancelado) {
                statProcCancelada++;
                revenueProcCancelado += (Number(s.value) || 0);
                // Cancelados NÃO somam em total, totalProcedimento, dailyRevenue nem sourceStats
            } else {
                cPro++;
                totalProcedimento += s.value;
                total += s.value;
                dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + s.value;
                if (!sourceStats[s.source]) sourceStats[s.source] = 0;
                sourceStats[s.source] += s.value;

                if (isRealizada) statProcRealizada++;
                else if (isAgendada) statProcAgendada++;
                else statRealizada++; // default para confirmados/realizados

                if (s.location === 'Cabo Frio') procCF++;
                if (s.location === 'Barra da Tijuca') procBarra++;

                // Mapeia para a segmentação por gênero e unidade
                if (s.location === 'Cabo Frio') {
                    if (isMulher) { procCF_Mulher++; revenueProcCF_Mulher += s.value; }
                    else if (isHomem) { procCF_Homem++; revenueProcCF_Homem += s.value; }
                } else if (s.location === 'Barra da Tijuca') {
                    if (isMulher) { procRJ_Mulher++; revenueProcRJ_Mulher += s.value; }
                    else if (isHomem) { procRJ_Homem++; revenueProcRJ_Homem += s.value; }
                } else if (s.location === 'Online') {
                    if (isMulher) { procOnline_Mulher++; revenueProcOnline_Mulher += s.value; }
                    else if (isHomem) { procOnline_Homem++; revenueProcOnline_Homem += s.value; }
                }
            }
        }

        // Função auxiliar de cohort: compara mês/ano da venda com mês/ano de referência
        const getCohortCategory = (saleDateStr, refDateStr) => {
            if (!refDateStr || !saleDateStr) return 'semData';
            const sYear = parseInt(saleDateStr.substring(0, 4));
            const sMonth = parseInt(saleDateStr.substring(5, 7));
            const rYear = parseInt(refDateStr.substring(0, 4));
            const rMonth = parseInt(refDateStr.substring(5, 7));
            if (isNaN(sYear) || isNaN(sMonth) || isNaN(rYear) || isNaN(rMonth)) return 'semData';
            const diffMonths = (sYear - rYear) * 12 + (sMonth - rMonth);
            if (diffMonths <= 0) return 'mes';
            if (diffMonths === 1) return 'd30';
            return 'd60';
        };

        // Análise de Ciclo & Safra de Consultas (Lead ➔ Consulta)
        if (s.type === 'Consulta' && s.date) {
            if (s.leadDate) {
                const dLeadStr = s.leadDate.includes('T') ? s.leadDate.split('T')[0] : s.leadDate;
                const dSaleStr = s.date.includes('T') ? s.date.split('T')[0] : s.date;
                const dLead = new Date(dLeadStr);
                const dSale = new Date(dSaleStr);
                const diffTime = dSale - dLead;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (!isNaN(diffDays) && diffDays >= 0) {
                    timesConsulta.push(diffDays);
                }

                const cat = getCohortCategory(dSaleStr, dLeadStr);
                if (cat === 'mes') conCohortMes++;
                else if (cat === 'd30') conCohort30++;
                else if (cat === 'd60') conCohort60++;
                else conCohortSemData++;
            } else {
                conCohortSemData++;
            }
        }

        // Análise de Ciclo & Safra de Procedimentos (válidos)
        if (s.type === 'Procedimento' && !isCancelado && s.date) {
            // Ciclo & Safra do Lead ➔ Procedimento
            if (s.leadDate) {
                const dLeadStr = s.leadDate.includes('T') ? s.leadDate.split('T')[0] : s.leadDate;
                const dSaleStr = s.date.includes('T') ? s.date.split('T')[0] : s.date;
                const dLead = new Date(dLeadStr);
                const dSale = new Date(dSaleStr);
                const diffTime = dSale - dLead;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (!isNaN(diffDays) && diffDays >= 0) {
                    timesProc.push(diffDays);
                }

                const catLead = getCohortCategory(dSaleStr, dLeadStr);
                if (catLead === 'mes') procLeadCohortMes++;
                else if (catLead === 'd30') procLeadCohort30++;
                else if (catLead === 'd60') procLeadCohort60++;
                else procLeadCohortSemData++;
            } else {
                procLeadCohortSemData++;
            }

            // Ciclo & Safra da Consulta ➔ Procedimento
            if (s.consultationDate) {
                const dConsStr = s.consultationDate.includes('T') ? s.consultationDate.split('T')[0] : s.consultationDate;
                const dSaleStr = s.date.includes('T') ? s.date.split('T')[0] : s.date;
                const dCons = new Date(dConsStr);
                const dSale = new Date(dSaleStr);
                const diffTimeCons = dSale - dCons;
                const diffDaysCons = Math.ceil(diffTimeCons / (1000 * 60 * 60 * 24));

                if (!isNaN(diffDaysCons) && diffDaysCons >= 0) {
                    timesConsToProc.push(diffDaysCons);
                }

                const catCons = getCohortCategory(dSaleStr, dConsStr);
                if (catCons === 'mes') procConsCohortMes++;
                else if (catCons === 'd30') procConsCohort30++;
                else if (catCons === 'd60') procConsCohort60++;
                else procConsCohortSemData++;
            } else {
                procConsCohortSemData++;
            }
        }
    });

    const { 
        totalInvest, totalLeadsCount, metaInvest, metaLeads, googleInvest, googleLeads,
        vendasInvest, vendasLeads, engajamentoInvest, engajamentoLeads,
        leadsHomem, leadsMulher, leadsRJ, leadsCF,
        leadsRJ_Mulher, leadsRJ_Homem, leadsCF_Mulher, leadsCF_Homem,
        investRJ_Mulher, investRJ_Homem, investCF_Mulher, investCF_Homem
    } = marketingData;

    const taxAmount = totalInvest * 0.1215;

    // Segmented investments (with 12.15% tax) and CPLs
    const investRealRJ_Mulher = (investRJ_Mulher || 0) * 1.1215;
    const investRealRJ_Homem = (investRJ_Homem || 0) * 1.1215;
    const investRealCF_Mulher = (investCF_Mulher || 0) * 1.1215;
    const investRealCF_Homem = (investCF_Homem || 0) * 1.1215;

    const cplRJ_Mulher = leadsRJ_Mulher > 0 ? (investRealRJ_Mulher / leadsRJ_Mulher) : 0;
    const cplRJ_Homem = leadsRJ_Homem > 0 ? (investRealRJ_Homem / leadsRJ_Homem) : 0;
    const cplCF_Mulher = leadsCF_Mulher > 0 ? (investRealCF_Mulher / leadsCF_Mulher) : 0;
    const cplCF_Homem = leadsCF_Homem > 0 ? (investRealCF_Homem / leadsCF_Homem) : 0;
    const totalInvestReal = totalInvest + taxAmount;
    const metaInvestReal = metaInvest * 1.1215;
    const googleInvestReal = googleInvest * 1.1215;
    const metaCPL = metaLeads > 0 ? (metaInvestReal / metaLeads) : 0;
    const googleCPL = googleLeads > 0 ? (googleInvestReal / googleLeads) : 0;
    const cpl = totalLeadsCount > 0 ? (totalInvestReal / totalLeadsCount) : 0;

    // Métricas por objetivo
    const vendasInvestReal = (vendasInvest || 0) * 1.1215;
    const vendasLeadsCount = vendasLeads || 0;
    const vendasCpl = vendasLeadsCount > 0 ? (vendasInvestReal / vendasLeadsCount) : 0;

    const engajamentoInvestReal = (engajamentoInvest || 0) * 1.1215;
    const engajamentoLeadsCount = engajamentoLeads || 0;
    const engajamentoCpl = engajamentoLeadsCount > 0 ? (engajamentoInvestReal / engajamentoLeadsCount) : 0;

    const avgCon = timesConsulta.length ? (timesConsulta.reduce((a, b) => a + b, 0) / timesConsulta.length).toFixed(0) : null;
    const avgPro = timesProc.length ? (timesProc.reduce((a, b) => a + b, 0) / timesProc.length).toFixed(0) : null;
    const avgConsToProc = timesConsToProc.length ? (timesConsToProc.reduce((a, b) => a + b, 0) / timesConsToProc.length).toFixed(0) : null;

    const roasConsulta = totalInvestReal > 0 ? (totalConsulta / totalInvestReal).toFixed(2) : null;
    const roasProcedimento = totalInvestReal > 0 ? (totalProcedimento / totalInvestReal).toFixed(2) : null;

    const leadsPerCon = cCon > 0 ? (totalLeadsCount / cCon).toFixed(1) : null;
    const cpaCon = (cCon > 0 && totalLeadsCount > 0) ? (cpl * (totalLeadsCount / cCon)) : 0;
    const conPerProc = cPro > 0 ? (statRealizada / cPro).toFixed(1) : null;
    const cpaPro = (cPro > 0 && cpaCon > 0 && statRealizada > 0) ? (cpaCon * (statRealizada / cPro)) : 0;
    const ticketMedioProc = cPro > 0 ? (totalProcedimento / cPro) : 0;
    const convLeadParaConsulta = totalLeadsCount > 0 ? ((cCon / totalLeadsCount) * 100).toFixed(1) : '0';
    const convConsultaParaProc = statRealizada > 0 ? ((cPro / statRealizada) * 100).toFixed(1) : '0';
    const rpl = totalLeadsCount > 0 ? (total / totalLeadsCount) : 0;

    const taxaProcCancelamento = cProTotal > 0 ? ((statProcCancelada / cProTotal) * 100).toFixed(1) : '0';
    const taxaProcRealizado = cProTotal > 0 ? ((statProcRealizada / cProTotal) * 100).toFixed(1) : '0';
    const taxaProcAgendado = cProTotal > 0 ? ((statProcAgendada / cProTotal) * 100).toFixed(1) : '0';

    const taxaConRealizada = cCon > 0 ? ((statRealizada / cCon) * 100).toFixed(1) : '0';
    const taxaConAgendada = cCon > 0 ? ((statAgendada / cCon) * 100).toFixed(1) : '0';
    const taxaConCancelada = cCon > 0 ? ((statCancelada / cCon) * 100).toFixed(1) : '0';

    // Métricas para IA
    const aiMetrics = {
        period: periodLabel || 'Período selecionado',
        faturamentoTotal: Number(total) || 0,
        investimentoTotal: Number(totalInvestReal) || 0,
        faturamentoConsulta: Number(totalConsulta) || 0,
        faturamentoProcedimento: Number(totalProcedimento) || 0,
        roasConsulta: totalInvestReal > 0 ? Number((totalConsulta / totalInvestReal).toFixed(2)) : null,
        roasProcedimento: totalInvestReal > 0 ? Number((totalProcedimento / totalInvestReal).toFixed(2)) : null,
        totalLeads: Number(totalLeadsCount) || 0,
        cplMedio: totalLeadsCount > 0 ? Number((totalInvestReal / totalLeadsCount).toFixed(2)) : null,
        consultasVendidas: Number(cCon) || 0,
        procedimentosVendidos: Number(cPro) || 0,
        procedimentosCancelados: Number(statProcCancelada) || 0,
        receitaCanceladaProcedimento: Number(revenueProcCancelado) || 0,
        taxaCancelamentoProcedimento: Number(taxaProcCancelamento) || 0,
        taxaComparecimentoConsulta: Number(taxaConRealizada) || 0,
        cpaConsulta: Number(cpaCon) || 0,
        cpaProcedimento: Number(cpaPro) || 0,
        leadsPorConsulta: cCon > 0 ? Number((totalLeadsCount / cCon).toFixed(2)) : null,
        consultasPorProcedimento: cPro > 0 ? Number((statRealizada / cPro).toFixed(2)) : null,
        ticketMedioProcedimento: cPro > 0 ? Number((totalProcedimento / cPro).toFixed(2)) : null,
        tempoMedioConsultaDias: timesConsulta.length ? Math.round(timesConsulta.reduce((a, b) => a + b, 0) / timesConsulta.length) : null,
        tempoMedioProcedimentoDias: timesProc.length ? Math.round(timesProc.reduce((a, b) => a + b, 0) / timesProc.length) : null,
        tempoMedioConsAoProcDias: timesConsToProc.length ? Math.round(timesConsToProc.reduce((a, b) => a + b, 0) / timesConsToProc.length) : null,
        vendasInvestReal: Number(vendasInvestReal) || 0,
        vendasLeadsCount: Number(vendasLeadsCount) || 0,
        vendasCpl: Number(vendasCpl) || 0,
        engajamentoInvestReal: Number(engajamentoInvestReal) || 0,
        engajamentoLeadsCount: Number(engajamentoLeadsCount) || 0,
        engajamentoCpl: Number(engajamentoCpl) || 0,
        leadsHomem: Number(leadsHomem) || 0,
        leadsMulher: Number(leadsMulher) || 0,
        leadsRJ: Number(leadsRJ) || 0,
        leadsCF: Number(leadsCF) || 0,
        leadsRJ_Mulher: Number(leadsRJ_Mulher) || 0,
        leadsRJ_Homem: Number(leadsRJ_Homem) || 0,
        leadsCF_Mulher: Number(leadsCF_Mulher) || 0,
        leadsCF_Homem: Number(leadsCF_Homem) || 0,
        conRJ_Mulher: Number(conRJ_Mulher) || 0,
        conRJ_Homem: Number(conRJ_Homem) || 0,
        realConRJ_Mulher: Number(realConRJ_Mulher) || 0,
        realConRJ_Homem: Number(realConRJ_Homem) || 0,
        procRJ_Mulher: Number(procRJ_Mulher) || 0,
        procRJ_Homem: Number(procRJ_Homem) || 0,
        conCF_Mulher: Number(conCF_Mulher) || 0,
        conCF_Homem: Number(conCF_Homem) || 0,
        realConCF_Mulher: Number(realConCF_Mulher) || 0,
        realConCF_Homem: Number(realConCF_Homem) || 0,
        procCF_Mulher: Number(procCF_Mulher) || 0,
        procCF_Homem: Number(procCF_Homem) || 0,
        conOnline_Mulher: Number(conOnline_Mulher) || 0,
        conOnline_Homem: Number(conOnline_Homem) || 0,
        realConOnline_Mulher: Number(realConOnline_Mulher) || 0,
        realConOnline_Homem: Number(realConOnline_Homem) || 0,
        investRealRJ_Mulher: Number(investRealRJ_Mulher) || 0,
        investRealRJ_Homem: Number(investRealRJ_Homem) || 0,
        investRealCF_Mulher: Number(investRealCF_Mulher) || 0,
        investRealCF_Homem: Number(investRealCF_Homem) || 0,
        cplRJ_Mulher: Number(cplRJ_Mulher) || 0,
        cplRJ_Homem: Number(cplRJ_Homem) || 0,
        cplCF_Mulher: Number(cplCF_Mulher) || 0,
        cplCF_Homem: Number(cplCF_Homem) || 0,
        revenueConRJ_Mulher: Number(revenueConRJ_Mulher) || 0,
        revenueConRJ_Homem: Number(revenueConRJ_Homem) || 0,
        revenueConCF_Mulher: Number(revenueConCF_Mulher) || 0,
        revenueConCF_Homem: Number(revenueConCF_Homem) || 0,
        revenueConOnline_Mulher: Number(revenueConOnline_Mulher) || 0,
        revenueConOnline_Homem: Number(revenueConOnline_Homem) || 0
    };

    // Consolidação de Safras / Cohort (Áudio 2 e 3)
    const totalConComData = conCohortMes + conCohort30 + conCohort60;
    const cohortCon = {
        mes: conCohortMes,
        mesPct: totalConComData > 0 ? ((conCohortMes / totalConComData) * 100).toFixed(1) : '0.0',
        d30: conCohort30,
        d30Pct: totalConComData > 0 ? ((conCohort30 / totalConComData) * 100).toFixed(1) : '0.0',
        d60: conCohort60,
        d60Pct: totalConComData > 0 ? ((conCohort60 / totalConComData) * 100).toFixed(1) : '0.0',
        semData: conCohortSemData,
        totalComData: totalConComData
    };

    const totalProcConsComData = procConsCohortMes + procConsCohort30 + procConsCohort60;
    const cohortProcCons = {
        mes: procConsCohortMes,
        mesPct: totalProcConsComData > 0 ? ((procConsCohortMes / totalProcConsComData) * 100).toFixed(1) : '0.0',
        d30: procConsCohort30,
        d30Pct: totalProcConsComData > 0 ? ((procConsCohort30 / totalProcConsComData) * 100).toFixed(1) : '0.0',
        d60: procConsCohort60,
        d60Pct: totalProcConsComData > 0 ? ((procConsCohort60 / totalProcConsComData) * 100).toFixed(1) : '0.0',
        semData: procConsCohortSemData,
        totalComData: totalProcConsComData
    };

    const totalProcLeadComData = procLeadCohortMes + procLeadCohort30 + procLeadCohort60;
    const cohortProcLead = {
        mes: procLeadCohortMes,
        mesPct: totalProcLeadComData > 0 ? ((procLeadCohortMes / totalProcLeadComData) * 100).toFixed(1) : '0.0',
        d30: procLeadCohort30,
        d30Pct: totalProcLeadComData > 0 ? ((procLeadCohort30 / totalProcLeadComData) * 100).toFixed(1) : '0.0',
        d60: procLeadCohort60,
        d60Pct: totalProcLeadComData > 0 ? ((procLeadCohort60 / totalProcLeadComData) * 100).toFixed(1) : '0.0',
        semData: procLeadCohortSemData,
        totalComData: totalProcLeadComData
    };

    return {
        total, totalConsulta, totalProcedimento, cCon, cPro,
        grouped, sourceStats, dailyRevenue,
        conCF, conBarra, conOnline, procCF, procBarra,
        statRealizada, statAgendada, statCancelada,
        statProcRealizada, statProcAgendada, statProcCancelada,
        cProTotal, revenueProcCancelado, revenueConCancelado,
        taxaProcCancelamento, taxaProcRealizado, taxaProcAgendado,
        taxaConRealizada, taxaConAgendada, taxaConCancelada,
        avgCon, avgPro, avgConsToProc,
        cohortCon, cohortProcCons, cohortProcLead,
        totalInvestReal, taxAmount, totalInvest,
        metaInvestReal, googleInvestReal, metaCPL, googleCPL,
        metaLeads, googleLeads, totalLeadsCount,
        cpl, roasConsulta, roasProcedimento,
        leadsPerCon, cpaCon, conPerProc, cpaPro,
        ticketMedioProc, convLeadParaConsulta, convConsultaParaProc,
        rpl, aiMetrics,
        vendasInvestReal, vendasLeadsCount, vendasCpl,
        engajamentoInvestReal, engajamentoLeadsCount, engajamentoCpl,
        leadsHomem, leadsMulher, leadsRJ, leadsCF,
        leadsRJ_Mulher, leadsRJ_Homem, leadsCF_Mulher, leadsCF_Homem,
        conRJ_Mulher, conRJ_Homem, realConRJ_Mulher, realConRJ_Homem, procRJ_Mulher, procRJ_Homem,
        conCF_Mulher, conCF_Homem, realConCF_Mulher, realConCF_Homem, procCF_Mulher, procCF_Homem,
        conOnline_Mulher, conOnline_Homem, realConOnline_Mulher, realConOnline_Homem, procOnline_Mulher, procOnline_Homem,
        investRealRJ_Mulher, investRealRJ_Homem, investRealCF_Mulher, investRealCF_Homem,
        cplRJ_Mulher, cplRJ_Homem, cplCF_Mulher, cplCF_Homem,
        revenueConRJ_Mulher, revenueConRJ_Homem, revenueConCF_Mulher, revenueConCF_Homem,
        revenueConOnline_Mulher, revenueConOnline_Homem,
        revenueProcRJ_Mulher, revenueProcRJ_Homem, revenueProcCF_Mulher, revenueProcCF_Homem,
        revenueProcOnline_Mulher, revenueProcOnline_Homem
    };
}

/**
 * Agrupa vendas por tag para tabela de performance
 */
export function groupSalesByTag(filteredSales, history) {
    const grouped = {};

    filteredSales.forEach(s => {
        let meta = { campaign: '-', adSet: '-', creativeName: '-' };
        const hItem = history.find(h => h.refCode === s.tag);
        if (hItem) {
            meta.campaign = hItem.campaign;
            meta.adSet = hItem.adSet;
            meta.creativeName = hItem.finalName;
        }
        if (!grouped[s.tag]) grouped[s.tag] = { count: 0, value: 0, ...meta };
        grouped[s.tag].count++;
        grouped[s.tag].value += s.value;
    });

    return grouped;
}
