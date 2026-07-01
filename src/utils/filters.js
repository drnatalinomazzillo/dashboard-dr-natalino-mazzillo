/**
 * Filtra vendas com base nos filtros selecionados
 */
export function getFilteredSales(sales, filters, history, publics, procedures) {
    const { period, filterStart, filterEnd, filterType, activeTypeFilter, filterPublic, filterProc,
        filterSeller, filterSource, filterLocation, selectedCreativeFilter } = filters;

    const fType = filterType !== 'all' ? filterType : activeTypeFilter;

    return sales.filter(sale => {
        let dRaw = sale.date;
        if (dRaw && dRaw.includes('T')) dRaw = dRaw.split('T')[0];
        const parts = dRaw.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);

        let passDate = true;
        const today = new Date();
        today.setHours(12, 0, 0, 0);

        if (period === 'today') {
            passDate = d.toDateString() === today.toDateString();
        } else if (period === 'week') {
            const f = new Date(today);
            f.setDate(today.getDate() - today.getDay());
            f.setHours(0, 0, 0, 0);
            passDate = d >= f;
        } else if (period === 'month') {
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
            passDate = d >= monthStart && d <= monthEnd;
        } else if (period === 'last_month') {
            const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1, 0, 0, 0);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
            passDate = d >= lastMonthStart && d <= lastMonthEnd;
        } else if (period === 'year') {
            const yearStart = new Date(today.getFullYear(), 0, 1, 0, 0, 0);
            passDate = d >= yearStart && d <= today;
        } else if (period === 'custom') {
            if (filterStart && filterEnd) {
                const sParts = filterStart.split('-');
                const s = new Date(sParts[0], sParts[1] - 1, sParts[2], 0, 0, 0);
                const eParts = filterEnd.split('-');
                const e = new Date(eParts[0], eParts[1] - 1, eParts[2], 23, 59, 59);
                passDate = d >= s && d <= e;
            }
        }

        let passType = true;
        if (fType !== 'all') {
            passType = sale.type === fType;
        }

        let passSeller = filterSeller ? sale.seller === filterSeller : true;
        let passSource = filterSource ? sale.source === filterSource : true;
        let passLocation = filterLocation ? sale.location === filterLocation : true;

        let tagPub = '', tagProc = '', tagCreativeName = '';
        if (sale.tag && sale.tag.startsWith('(Ref:')) {
            const historyItem = history.find(h => h.refCode === sale.tag);
            if (historyItem) {
                tagCreativeName = historyItem.finalName;
                const content = sale.tag.match(/\(Ref:\s*([A-Z0-9]+)-/);
                if (content) {
                    const code = content[1];
                    const p = publics.find(pub => code.startsWith(pub.code));
                    if (p) {
                        tagPub = p.code;
                        const r = code.replace(p.code, '');
                        const pr = procedures.find(x => r === x.code);
                        if (pr) tagProc = pr.code;
                    }
                }
            }
        }

        let passPubFilter = filterPublic ? tagPub === filterPublic : true;
        let passProcFilter = filterProc ? tagProc === filterProc : true;
        let passCreative = selectedCreativeFilter ? tagCreativeName === selectedCreativeFilter : true;

        return passDate && passType && passPubFilter && passProcFilter && passCreative && passSeller && passSource && passLocation;
    });
}

/**
 * Filtra dados de marketing com base no período e local
 */
export function getFilteredMarketing(marketing, period, filterStart, filterEnd, filterLocation, filterCampaignObjective = 'all') {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    let totalInvest = 0, totalLeadsCount = 0;
    let metaInvest = 0, metaLeads = 0;
    let googleInvest = 0, googleLeads = 0;

    let vendasInvest = 0, vendasLeads = 0;
    let engajamentoInvest = 0, engajamentoLeads = 0;

    let leadsRJ_Mulher = 0, leadsRJ_Homem = 0;
    let leadsCF_Mulher = 0, leadsCF_Homem = 0;
    let investRJ_Mulher = 0, investRJ_Homem = 0;
    let investCF_Mulher = 0, investCF_Homem = 0;

    if (!marketing) return { 
        totalInvest, totalLeadsCount, metaInvest, metaLeads, googleInvest, googleLeads, 
        vendasInvest, vendasLeads, engajamentoInvest, engajamentoLeads,
        leadsHomem: 0, leadsMulher: 0, leadsRJ: 0, leadsCF: 0,
        leadsRJ_Mulher, leadsRJ_Homem, leadsCF_Mulher, leadsCF_Homem,
        investRJ_Mulher: 0, investRJ_Homem: 0, investCF_Mulher: 0, investCF_Homem: 0
    };

    marketing.forEach(m => {
        const investStart = new Date(m.startDate + 'T00:00:00');
        const investEnd = m.endDate ? new Date(m.endDate + 'T23:59:59') : new Date(m.startDate + 'T23:59:59');

        let passDate = true;
        if (period === 'today') passDate = investStart <= today && investEnd >= today;
        else if (period === 'week') {
            const f = new Date(today);
            f.setDate(today.getDate() - today.getDay());
            f.setHours(0, 0, 0, 0);
            passDate = investEnd >= f && investStart <= today;
        } else if (period === 'month') {
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
            passDate = investEnd >= monthStart && investStart <= today;
        } else if (period === 'last_month') {
            const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1, 0, 0, 0);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
            passDate = investEnd >= lastMonthStart && investStart <= lastMonthEnd;
        } else if (period === 'year') {
            const yearStart = new Date(today.getFullYear(), 0, 1, 0, 0, 0);
            passDate = investEnd >= yearStart && investStart <= today;
        } else if (period === 'custom') {
            if (filterStart && filterEnd) {
                const s = new Date(filterStart + 'T00:00:00');
                const e = new Date(filterEnd + 'T23:59:59');
                passDate = investEnd >= s && investStart <= e;
            }
        }

        let passLoc = true;
        let investmentToAdd = m.investment;
        let leadsToAdd = m.leads;

        if (filterLocation) {
            if (m.location === 'Ambos') {
                investmentToAdd = m.investment / 2;
                leadsToAdd = Math.ceil(m.leads / 2);
            } else if (m.location !== filterLocation) {
                passLoc = false;
            }
        }

        // Classificação por objetivo
        let isEngajamento = false;
        const compName = m.metaCampaignName || m.campaignName || '';
        if (compName) {
            const nameUpper = compName.toUpperCase();
            isEngajamento = nameUpper.includes('ENGAJAMENTO') || nameUpper.includes('ENG') || nameUpper.includes('VIDEO') || nameUpper.includes('ALCANCE');
        }

        let passObjective = true;
        if (filterCampaignObjective === 'vendas') {
            passObjective = !isEngajamento;
        } else if (filterCampaignObjective === 'engajamento') {
            passObjective = isEngajamento;
        }

        if (passDate && passLoc) {
            // Acumula para a distribuição side-by-side geral (independente do filtro de objetivo atual)
            if (isEngajamento) {
                engajamentoInvest += investmentToAdd;
                engajamentoLeads += leadsToAdd;
            } else {
                vendasInvest += investmentToAdd;
                vendasLeads += leadsToAdd;
            }

            // Acumula nas métricas principais se passar pelo filtro de objetivo
            if (passObjective) {
                totalInvest += investmentToAdd;
                totalLeadsCount += leadsToAdd;

                if (m.platform === 'Meta Ads') { metaInvest += investmentToAdd; metaLeads += leadsToAdd; }
                else if (m.platform === 'Google Ads') { googleInvest += investmentToAdd; googleLeads += leadsToAdd; }

                // Determina distribuição por local para este registro
                let rjLeadsForRecord = 0;
                let cfLeadsForRecord = 0;
                let rjInvestForRecord = 0;
                let cfInvestForRecord = 0;
                const loc = (m.location || "").trim();
                if (loc === 'Barra da Tijuca') {
                    rjLeadsForRecord = leadsToAdd;
                    rjInvestForRecord = investmentToAdd;
                } else if (loc === 'Cabo Frio') {
                    cfLeadsForRecord = leadsToAdd;
                    cfInvestForRecord = investmentToAdd;
                } else { // Ambos
                    if (filterLocation === 'Cabo Frio') {
                        cfLeadsForRecord = leadsToAdd;
                        cfInvestForRecord = investmentToAdd;
                    } else if (filterLocation === 'Barra da Tijuca') {
                        rjLeadsForRecord = leadsToAdd;
                        rjInvestForRecord = investmentToAdd;
                    } else {
                        rjLeadsForRecord = Math.ceil(leadsToAdd / 2);
                        cfLeadsForRecord = Math.floor(leadsToAdd / 2);
                        rjInvestForRecord = investmentToAdd / 2;
                        cfInvestForRecord = investmentToAdd / 2;
                    }
                }

                // Distribui os leads e investimentos do local por público (gênero) - Apenas para campanhas de Vendas/Leads (exclui Branding/Engajamento)
                if (!isEngajamento) {
                    const camp = (m.campaign || "").trim();
                    if (camp === 'Homem') {
                        leadsRJ_Homem += rjLeadsForRecord;
                        leadsCF_Homem += cfLeadsForRecord;
                        investRJ_Homem += rjInvestForRecord;
                        investCF_Homem += cfInvestForRecord;
                    } else if (camp === 'Mulher') {
                        leadsRJ_Mulher += rjLeadsForRecord;
                        leadsCF_Mulher += cfLeadsForRecord;
                        investRJ_Mulher += rjInvestForRecord;
                        investCF_Mulher += cfInvestForRecord;
                    } else { // Ambos
                        leadsRJ_Homem += Math.ceil(rjLeadsForRecord / 2);
                        leadsRJ_Mulher += Math.floor(rjLeadsForRecord / 2);
                        leadsCF_Homem += Math.ceil(cfLeadsForRecord / 2);
                        leadsCF_Mulher += Math.floor(cfLeadsForRecord / 2);

                        investRJ_Homem += rjInvestForRecord / 2;
                        investRJ_Mulher += rjInvestForRecord / 2;
                        investCF_Homem += cfInvestForRecord / 2;
                        investCF_Mulher += cfInvestForRecord / 2;
                    }
                }
            }
        }
    });

    const leadsRJ = leadsRJ_Mulher + leadsRJ_Homem;
    const leadsCF = leadsCF_Mulher + leadsCF_Homem;
    const leadsHomem = leadsRJ_Homem + leadsCF_Homem;
    const leadsMulher = leadsRJ_Mulher + leadsCF_Mulher;

    return { 
        totalInvest, totalLeadsCount, metaInvest, metaLeads, googleInvest, googleLeads,
        vendasInvest, vendasLeads, engajamentoInvest, engajamentoLeads,
        leadsHomem, leadsMulher, leadsRJ, leadsCF,
        leadsRJ_Mulher, leadsRJ_Homem, leadsCF_Mulher, leadsCF_Homem,
        investRJ_Mulher, investRJ_Homem, investCF_Mulher, investCF_Homem
    };
}
