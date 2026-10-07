import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { getFilteredSales, getFilteredMarketing } from '../../utils/filters';
import { calculateMetrics, groupSalesByTag } from '../../utils/calculations';
import { formatDateBR, formatCurrency, calculateLeadTime } from '../../utils/formatters';
import { analyzeDataWithAI } from '../../services/geminiService';
import { addMarketing as apiAddMarketing } from '../../services/apiService';
import { exportAIReport } from '../../services/pdfService';
import { marked } from 'marked';
import Chart from 'chart.js/auto';
import Modal from '../common/Modal';
import CustomDropdown from '../common/CustomDropdown';
import { ComposedChart, Line, Bar, LabelList, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

function generateEvolutionData(filteredSales, marketing, filters) {
    const { period, filterStart, filterEnd, filterLocation, filterCampaignObjective } = filters;
    const map = new Map();
    const isYearOrAll = period === 'year' || period === 'all' || period === 'custom';
    
    let groupBy = isYearOrAll ? 'month' : 'day';
    if (period === 'custom' && filterStart && filterEnd) {
        const d1 = new Date(filterStart);
        const d2 = new Date(filterEnd);
        if ((d2 - d1) / (1000 * 60 * 60 * 24) <= 31) groupBy = 'day';
    }

    const getFormatKey = (dStr) => {
        let d = dStr;
        if (d && d.includes('T')) d = d.split('T')[0];
        if (!d) return null;
        const parts = d.split('-');
        if (parts.length < 3) return null;
        if (groupBy === 'month') return `${parts[0]}-${parts[1]}`;
        return `${parts[0]}-${parts[1]}-${parts[2]}`;
    };

    const formatLabel = (key) => {
        if (!key) return '';
        const parts = key.split('-');
        if (groupBy === 'month') {
            const date = new Date(parts[0], parts[1] - 1, 1);
            return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        }
        const date = new Date(parts[0], parts[1] - 1, parts[2], 12);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    if (marketing) {
        marketing.forEach(m => {
            let passLoc = true;
            let investmentToAdd = (m.investment || 0) * 1.1215; // Incorpora impostos de 12.15%
            let leadsToAdd = m.leads || 0;

            if (filterLocation) {
                if (m.location === 'Ambos') {
                    investmentToAdd = investmentToAdd / 2;
                    leadsToAdd = leadsToAdd / 2;
                } else if (m.location !== filterLocation) {
                    passLoc = false;
                }
            }

            let isEngajamento = false;
            const compName = m.metaCampaignName || m.campaignName || '';
            if (compName) {
                const lower = compName.toLowerCase();
                if (lower.includes('engajamento') || lower.includes('visualização') || lower.includes('seguidores')) {
                    isEngajamento = true;
                }
            }
            let passObj = true;
            if (filterCampaignObjective === 'vendas' && isEngajamento) passObj = false;
            if (filterCampaignObjective === 'engajamento' && !isEngajamento) passObj = false;

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
            } else if (period === 'custom' && filterStart && filterEnd) {
                const s = new Date(filterStart + 'T00:00:00');
                const e = new Date(filterEnd + 'T23:59:59');
                passDate = investEnd >= s && investStart <= e;
            }

            if (passLoc && passObj && passDate) {
                let days = 1;
                if (groupBy === 'day' && m.endDate && m.endDate !== m.startDate) {
                    const s = new Date(m.startDate + 'T12:00:00');
                    const e = new Date(m.endDate + 'T12:00:00');
                    days = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
                }

                const valPerDayInvest = investmentToAdd / days;
                const valPerDayLeads = leadsToAdd / days;

                for (let i = 0; i < days; i++) {
                    let currentD = new Date(m.startDate + 'T12:00:00');
                    currentD.setDate(currentD.getDate() + i);
                    const dStr = currentD.toISOString().split('T')[0];
                    const key = getFormatKey(dStr);
                    
                    if (!key) continue;
                    if (!map.has(key)) map.set(key, { key, leads: 0, invest: 0, consultas: 0, procedimentos: 0, faturamento: 0 });
                    const entry = map.get(key);
                    entry.leads += valPerDayLeads;
                    entry.invest += valPerDayInvest;
                }
            }
        });
    }

    if (filteredSales) {
        filteredSales.forEach(s => {
            const key = getFormatKey(s.date);
            if (!key) return;
            if (!map.has(key)) map.set(key, { key, leads: 0, invest: 0, consultas: 0, procedimentos: 0, faturamento: 0 });
            const entry = map.get(key);
            
            const st = (s.status || '').toLowerCase();
            const isCancelado = st.includes('cancelad') || st.includes('não compareceu');

            if (s.type === 'Consulta') {
                entry.consultas += 1;
                entry.faturamento += parseFloat(s.value) || 0;
            } else if (s.type === 'Procedimento') {
                if (!isCancelado) {
                    entry.procedimentos = (entry.procedimentos || 0) + 1;
                    entry.faturamento += parseFloat(s.value) || 0;
                }
            }
        });
    }

    const data = Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
    
    const maxInvest = Math.max(...data.map(d => d.invest), 0);
    const maxFat = Math.max(...data.map(d => d.faturamento), 0);
    const maxLeads = Math.max(...data.map(d => d.leads), 0);
    const maxCons = Math.max(...data.map(d => d.consultas), 0);
    const maxProc = Math.max(...data.map(d => d.procedimentos || 0), 0);
    const maxCpl = Math.max(...data.map(d => d.leads > 0 ? d.invest / d.leads : 0), 0);

    return data.map(d => {
        const cplVal = d.leads > 0 ? d.invest / d.leads : 0;
        return {
            label: formatLabel(d.key),
            
            // Valores Reais
            realInvestimento: parseFloat(d.invest.toFixed(2)),
            realFaturamento: d.faturamento,
            realLeads: Math.round(d.leads),
            realConsultas: d.consultas,
            realProcedimentos: d.procedimentos || 0,
            realCPL: cplVal,

            // Valores Normalizados (% do pico no período)
            normInvestimento: maxInvest > 0 ? parseFloat(((d.invest / maxInvest) * 100).toFixed(1)) : 0,
            normFaturamento: maxFat > 0 ? parseFloat(((d.faturamento / maxFat) * 100).toFixed(1)) : 0,
            normLeads: maxLeads > 0 ? parseFloat(((d.leads / maxLeads) * 100).toFixed(1)) : 0,
            normConsultas: maxCons > 0 ? parseFloat(((d.consultas / maxCons) * 100).toFixed(1)) : 0,
            normProcedimentos: maxProc > 0 ? parseFloat((((d.procedimentos || 0) / maxProc) * 100).toFixed(1)) : 0,
            normCPL: maxCpl > 0 ? parseFloat(((cplVal / maxCpl) * 100).toFixed(1)) : 0,

            // Atributos diretos para modo absoluto
            Investimento: parseFloat(d.invest.toFixed(2)),
            Faturamento: d.faturamento,
            Leads: Math.round(d.leads),
            Consultas: d.consultas,
            Procedimentos: d.procedimentos || 0,
            CPL: cplVal
        };
    });
}

function FunnelCard({ title, icon, borderColor, iconColor, bgHeaderClass, leads, invest, cpl, cons, realCons, procs, revenueProc, revenueCons = 0, hideLeads }) {
    const convLeadCons = leads > 0 ? (cons / leads) * 100 : 0;
    const convConsRealiz = cons > 0 ? (realCons / cons) * 100 : 0;
    const convConsProc = realCons > 0 ? (procs / realCons) * 100 : 0;
    const cpaCons = cons > 0 ? invest / cons : 0;
    const cpaProc = procs > 0 ? invest / procs : 0;
    const ticketMedio = procs > 0 ? revenueProc / procs : 0;
    const totalRevenue = revenueProc + revenueCons;
    const roas = invest > 0 ? totalRevenue / invest : 0;
    
    return (
        <div className={`glass-panel p-4 rounded-xl border-t-4 ${borderColor} ${bgHeaderClass} flex flex-col gap-2 relative shadow-lg`}>
            <h4 className={`text-xs font-bold ${iconColor} uppercase flex items-center gap-1.5 mb-2`}>
                {icon} {title}
            </h4>
            
            {!hideLeads && (
                <>
                    <div className="bg-black/40 p-3 rounded-lg border border-white/10">
                        <div className="flex justify-between items-end mb-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">1. Leads</p>
                            <span className="text-[10px] text-gray-500 font-mono">CPL: {formatCurrency(cpl)}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <h4 className="text-2xl font-bold text-white font-mono">{leads}</h4>
                            {invest > 0 && (
                                <span className="text-[9px] text-gray-400 font-mono bg-gray-800/50 px-2 py-0.5 rounded border border-gray-700/50">
                                    Inv: {formatCurrency(invest)}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex justify-center -my-3 relative z-10">
                        <span className={`bg-gray-900 border border-gray-700 text-[10px] px-3 py-1 rounded-full ${iconColor} flex items-center gap-1 font-bold shadow-md`}>
                            <i className="ph-bold ph-arrow-down"></i> {convLeadCons.toFixed(1)}%
                        </span>
                    </div>
                </>
            )}

            <div className="bg-black/40 p-3 rounded-lg border border-white/10">
                <div className="flex justify-between items-end mb-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">2. Consultas</p>
                    <span className="text-[10px] text-gray-500 font-mono">CPA: {formatCurrency(cpaCons)}</span>
                </div>
                <h4 className="text-2xl font-bold text-white font-mono">{cons} <span className="text-xs text-gray-500 font-normal">({realCons} Realiz.{cons > 0 ? ` • ${convConsRealiz.toFixed(1)}%` : ''})</span></h4>
            </div>

            <div className="flex justify-center -my-3 relative z-10">
                <span className={`bg-gray-900 border border-gray-700 text-[10px] px-3 py-1 rounded-full ${iconColor} flex items-center gap-1 font-bold shadow-md`}>
                    <i className="ph-bold ph-arrow-down"></i> {convConsProc.toFixed(1)}%
                </span>
            </div>

            <div className="bg-black/40 p-3 rounded-lg border border-white/10">
                <div className="flex justify-between items-end mb-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">3. Procedimentos</p>
                    <span className="text-[10px] text-gray-500 font-mono">CPA: {formatCurrency(cpaProc)}</span>
                </div>
                <h4 className="text-2xl font-bold text-white font-mono">{procs}</h4>
            </div>

            <div className="flex justify-center -my-3 relative z-10">
                <span className={`bg-gray-900 border border-gray-700 text-[9px] px-3 py-1 rounded-full ${iconColor} flex items-center gap-1 font-bold shadow-md`}>
                    <i className="ph-bold ph-arrow-down"></i> Ticket Médio: {formatCurrency(ticketMedio)}
                </span>
            </div>

            <div className="bg-black/40 p-3 rounded-lg border border-emerald-900/30 bg-gradient-to-br from-emerald-950/10 to-transparent">
                <div className="flex justify-between items-end mb-1">
                    <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">4. Faturamento</p>
                    <span className="text-[10px] text-gray-500 font-mono">ROAS: <span className="text-emerald-400 font-bold">{roas.toFixed(1)}x</span></span>
                </div>
                <h4 className="text-2xl font-bold text-emerald-400 font-mono">{formatCurrency(totalRevenue)}</h4>
            </div>
        </div>
    );
}

export default function AnalyticsTab() {
    const { state, dispatch, showToast, getAllCreatives } = useApp();
    const { sales, marketing, history, publics, procedures } = state;

    // Filters
    const [period, setPeriod] = useState('month');
    const [filterStart, setFilterStart] = useState('');
    const [filterEnd, setFilterEnd] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [activeTypeFilter, setActiveTypeFilter] = useState('all');
    const [filterPublic, setFilterPublic] = useState('');
    const [filterProc, setFilterProc] = useState('');
    const [filterSeller, setFilterSeller] = useState('');
    const [filterSource, setFilterSource] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [selectedCreativeFilter, setSelectedCreativeFilter] = useState('');
    const [filterCampaignObjective, setFilterCampaignObjective] = useState('all');
    const [filtersOpen, setFiltersOpen] = useState(true);

    // UI toggles
    const [performanceOpen, setPerformanceOpen] = useState(true);
    const [logOpen, setLogOpen] = useState(false);
    const [chartScaleMode, setChartScaleMode] = useState('relative'); // 'relative' (%) or 'absolute'
    const [showDataLabels, setShowDataLabels] = useState(true);
    const [visibleLines, setVisibleLines] = useState({
        faturamento: true,
        investimento: true,
        leads: true,
        consultas: true,
        procedimentos: true,
        cpl: false
    });
    const toggleLine = (key) => setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));

    // AI
    const [aiHTML, setAiHTML] = useState('');
    const [showAI, setShowAI] = useState(false);
    const [analyzingAI, setAnalyzingAI] = useState(false);

    // Marketing Modal
    const [showMktModal, setShowMktModal] = useState(false);
    const [mktStartDate, setMktStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [mktEndDate, setMktEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [mktCampaign, setMktCampaign] = useState('Homem');
    const [mktLocation, setMktLocation] = useState('Cabo Frio');
    const [mktInvestment, setMktInvestment] = useState('');
    const [mktPlatform, setMktPlatform] = useState('Meta Ads');
    const [mktLeads, setMktLeads] = useState('');
    const [savingMkt, setSavingMkt] = useState(false);

    // Details Modal
    const [detailsTag, setDetailsTag] = useState(null);


    // Chart refs
    const revenueChartRef = useRef(null);
    const sourceChartRef = useRef(null);
    const tagsChartRef = useRef(null);
    const mktPieRef = useRef(null);
    const chartInstances = useRef({});

    // Compute filtered data
    const filters = { period, filterStart, filterEnd, filterType, activeTypeFilter, filterPublic, filterProc, filterSeller, filterSource, filterLocation, selectedCreativeFilter, filterCampaignObjective };
    const filteredSales = getFilteredSales(sales, filters, history, publics, procedures);
    const mktData = getFilteredMarketing(marketing, period, filterStart, filterEnd, filterLocation, filterCampaignObjective);
    const periodLabel = period === 'month' ? 'Este Mês' : period === 'last_month' ? 'Mês Anterior' : period === 'year' ? 'Este Ano' : period === 'today' ? 'Hoje' : period === 'week' ? 'Esta Semana' : period === 'all' ? 'Todo o Período' : 'Personalizado';
    const metrics = calculateMetrics(filteredSales, mktData, periodLabel);
    const grouped = groupSalesByTag(filteredSales, history);
    const evolutionData = generateEvolutionData(filteredSales, marketing, filters);


    // Chart rendering
    const renderCharts = useCallback(() => {
        // Destroy old charts
        Object.values(chartInstances.current).forEach(c => { if (c instanceof Chart) c.destroy(); });
        chartInstances.current = {};

        // Revenue Chart
        if (revenueChartRef.current) {
            const sortedDates = Object.keys(metrics.dailyRevenue).sort();
            chartInstances.current.revenue = new Chart(revenueChartRef.current.getContext('2d'), {
                type: 'line',
                data: { labels: sortedDates.map(d => formatDateBR(d)), datasets: [{ label: 'Vendas', data: sortedDates.map(d => metrics.dailyRevenue[d]), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 2, tension: 0.4, fill: true, pointRadius: 0, pointHoverRadius: 4 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
            });
        }

        // Source Chart
        if (sourceChartRef.current) {
            chartInstances.current.source = new Chart(sourceChartRef.current.getContext('2d'), {
                type: 'doughnut',
                data: { labels: Object.keys(metrics.sourceStats), datasets: [{ data: Object.values(metrics.sourceStats), backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1'], borderWidth: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#9ca3af', font: { size: 10 } } }, tooltip: { callbacks: { label: ctx => formatCurrency(ctx.raw) } } } }
            });
        }

        // Tags Chart
        if (tagsChartRef.current) {
            const top5 = Object.keys(grouped).sort((a, b) => grouped[b].value - grouped[a].value).slice(0, 5);
            chartInstances.current.tags = new Chart(tagsChartRef.current.getContext('2d'), {
                type: 'bar',
                data: { labels: top5, datasets: [{ label: 'Faturamento', data: top5.map(t => grouped[t].value), backgroundColor: 'rgba(59, 130, 246, 0.8)', borderRadius: 4 }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { display: false }, x: { ticks: { color: '#9ca3af', font: { size: 10 }, maxRotation: 45, minRotation: 45 } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => formatCurrency(ctx.raw) } } } }
            });
        }

        // Marketing Pie
        if (mktPieRef.current && (metrics.metaInvestReal > 0 || metrics.googleInvestReal > 0)) {
            chartInstances.current.mktPie = new Chart(mktPieRef.current.getContext('2d'), {
                type: 'doughnut',
                data: { labels: ['Meta Ads', 'Google Ads'], datasets: [{ data: [metrics.metaInvestReal, metrics.googleInvestReal], backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(249, 115, 22, 0.8)'], borderColor: ['#3b82f6', '#f97316'], borderWidth: 1, hoverOffset: 2 }] },
                options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => formatCurrency(ctx.raw) } } } }
            });
        }
    }, [metrics, grouped]);

    useEffect(() => {
        const timer = setTimeout(renderCharts, 100);
        return () => clearTimeout(timer);
    }, [renderCharts]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(chartInstances.current).forEach(c => { if (c instanceof Chart) c.destroy(); });
        };
    }, []);

    function filterByType(type) {
        setActiveTypeFilter(type);
        if (type === 'all') setFilterType('all');
        else setFilterType(type);
    }

    function clearFilters() {
        setPeriod('month'); setFilterPublic(''); setFilterProc('');
        setFilterSeller(''); setSelectedCreativeFilter('');
        setFilterSource(''); setFilterLocation('');
        setActiveTypeFilter('all'); setFilterType('all');
        setFilterCampaignObjective('all');
    }

    async function handleAnalyzeAI() {
        if (filteredSales.length === 0) return alert("Sem dados para analisar neste período.");
        setAnalyzingAI(true);
        try {
            const result = await analyzeDataWithAI(metrics.aiMetrics);
            if (result) { setAiHTML(marked.parse(result)); setShowAI(true); }
        } catch (e) { alert("Erro ao conectar com a IA: " + e.message); }
        setAnalyzingAI(false);
    }

    async function handleAddMarketing() {
        const investment = parseFloat(mktInvestment);
        const leads = parseFloat(mktLeads);
        if (!mktStartDate || !mktEndDate || isNaN(investment) || isNaN(leads)) return alert("Preencha todos os campos");

        const newMkt = { startDate: mktStartDate, endDate: mktEndDate, campaign: mktCampaign, location: mktLocation, investment, platform: mktPlatform, leads };
        setSavingMkt(true);
        try {
            await apiAddMarketing(newMkt);
            dispatch({ type: 'ADD_MARKETING', payload: newMkt });
            showToast("Marketing Salvo!");
            setMktInvestment(''); setMktLeads('');
            setTimeout(() => setShowMktModal(false), 500);
        } catch (e) { console.error(e); alert("Erro ao salvar"); }
        setSavingMkt(false);
    }

    // Sorted performance table
    const sortedTags = Object.keys(grouped).sort((a, b) => grouped[b].value - grouped[a].value);

    // Details modal data
    let detailsSales = [];
    let detailsContext = '';
    if (detailsTag !== null) {
        if (detailsTag === 'ALL') { detailsSales = filteredSales; detailsContext = "Todas as Vendas"; }
        else if (detailsTag === 'ORGÂNICO') { detailsSales = filteredSales.filter(s => ['Instagram', 'Site', 'SITE', 'Indicação', 'Reativação Cliente', 'Reativação Vendedora', 'Orgânico', 'Paciente Antigo'].includes(s.source)); detailsContext = "Origem: Orgânico / Outros"; }
        else if (detailsTag === 'Tráfego Pago') { detailsSales = filteredSales.filter(s => s.source === 'Tráfego Pago'); detailsContext = "Origem: Tráfego Pago (Todas as Tags)"; }
        else { detailsSales = filteredSales.filter(s => s.tag && s.tag.toUpperCase() === detailsTag.toUpperCase()); const hm = history.find(h => h.refCode && h.refCode.toUpperCase() === detailsTag.toUpperCase()); detailsContext = hm ? `${detailsTag} - ${hm.campaign}` : `Tag: ${detailsTag}`; }
    }

    return (
        <div className="w-full max-w-[1400px]">
            <div className="grid grid-cols-1 gap-8">
                <section className="space-y-6">

                    {/* FILTERS */}
                    <div className="glass-panel rounded-2xl relative z-30 overflow-hidden">
                        <div className="p-4 flex items-center justify-between cursor-pointer border-b border-gray-800/50 transition-colors hover:bg-white/5" onClick={() => setFiltersOpen(!filtersOpen)}>
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-600/20 p-2 rounded-lg" style={{ padding: '0.35rem' }}><i className="ph-fill ph-funnel text-blue-400 text-lg"></i></div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Filtros de Análise</h3>
                            </div>
                            <i className={`ph-bold ${filtersOpen ? 'ph-caret-up' : 'ph-caret-down'} text-gray-400`} style={{ fontSize: '1.1rem' }}></i>
                        </div>
                        {filtersOpen && (
                            <div className="p-5 pt-4 flex flex-col gap-4 transition-all duration-300">
                                <div className="flex gap-3 items-end w-full">
                                    <div className="flex-1 max-w-[200px]">
                                        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Período</label>
                                        <select value={period} onChange={e => setPeriod(e.target.value)} className="input-field w-full rounded-lg px-3 py-2 text-xs cursor-pointer">
                                            <option value="month">Este Mês</option>
                                            <option value="last_month">Mês Anterior</option>
                                            <option value="year">Este Ano</option>
                                            <option value="today">Hoje</option>
                                            <option value="week">Esta Semana</option>
                                            <option value="all">Todo o Período</option>
                                            <option value="custom">Personalizado</option>
                                        </select>
                                    </div>
                                    {period === 'custom' && (
                                        <div className="flex gap-2 flex-1">
                                            <div className="flex-1"><label className="text-[10px] text-gray-500 uppercase block mb-1">Início</label><input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="input-field w-full rounded-lg px-2 py-2 text-xs" /></div>
                                            <div className="flex-1"><label className="text-[10px] text-gray-500 uppercase block mb-1">Fim</label><input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="input-field w-full rounded-lg px-2 py-2 text-xs" /></div>
                                        </div>
                                    )}
                                    <button onClick={() => {}} className="h-[34px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-900/30 cursor-pointer transition-all hover:scale-105 ml-auto">
                                        <i className="ph-bold ph-magnifying-glass"></i> Filtrar
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-gray-800/50">
                                    <div><label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Tipo Venda</label><select value={filterType} onChange={e => { setFilterType(e.target.value); setActiveTypeFilter(e.target.value); }} className="input-field w-full rounded-lg px-2 py-1.5 text-xs"><option value="all">Todos</option><option value="Consulta">Só Consultas</option><option value="Procedimento">Só Procedimentos</option></select></div>
                                    <div><label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Público</label><select value={filterPublic} onChange={e => setFilterPublic(e.target.value)} className="input-field w-full rounded-lg px-2 py-1.5 text-xs"><option value="">Todos</option>{publics.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select></div>
                                    <div><label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Procedimento</label><select value={filterProc} onChange={e => setFilterProc(e.target.value)} className="input-field w-full rounded-lg px-2 py-1.5 text-xs"><option value="">Todos</option>{procedures.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select></div>
                                    <div><label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Vendedora</label><select value={filterSeller} onChange={e => setFilterSeller(e.target.value)} className="input-field w-full rounded-lg px-2 py-1.5 text-xs"><option value="">Todas</option><option value="Amanda">Amanda</option><option value="Daniele">Daniele</option><option value="Margo">Margo</option><option value="Outro">Outro</option></select></div>
                                    <div><label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Origem Lead</label><select value={filterSource === 'Site' ? 'SITE' : filterSource} onChange={e => setFilterSource(e.target.value)} className="input-field w-full rounded-lg px-2 py-1.5 text-xs cursor-pointer"><option value="">Todas</option><option value="Tráfego Pago">Tráfego Pago</option><option value="Instagram">Instagram</option><option value="SITE">SITE</option><option value="Orgânico">Orgânico</option><option value="Indicação">Indicação</option><option value="Paciente Antigo">Paciente Antigo</option><option value="Reativação Cliente">Reativação Cliente</option><option value="Reativação Vendedora">Reativação Vendedora</option></select></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                    <div><label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Local (Unidade)</label><select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="input-field w-full rounded-lg px-2 py-1.5 text-xs"><option value="">Todas</option><option value="Cabo Frio">Cabo Frio</option><option value="Barra da Tijuca">Barra da Tijuca</option></select></div>
                                    <div>
                                        <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Objetivo da Campanha</label>
                                        <select value={filterCampaignObjective} onChange={e => setFilterCampaignObjective(e.target.value)} className="input-field w-full rounded-lg px-2 py-1.5 text-xs">
                                            <option value="all">Todos os Objetivos</option>
                                            <option value="vendas">Vendas / Leads</option>
                                            <option value="engajamento">Engajamento / Branding</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Buscar Criativo</label>
                                        <CustomDropdown items={getAllCreatives()} value={selectedCreativeFilter} onChange={setSelectedCreativeFilter} placeholder="Nome ou código..." className="px-3 py-1.5" />
                                    </div>
                                </div>
                                <div className="flex justify-end"><button onClick={clearFilters} className="text-[10px] text-gray-500 hover:text-red-400 underline cursor-pointer">Limpar Tudo</button></div>
                            </div>
                        )}
                    </div>

                    {/* OVERVIEW HEADER */}
                    <div className="flex justify-between items-center mt-6 border-b border-gray-800 pb-3 mb-4 relative z-10">
                        <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                            <i className="ph-fill ph-chart-line-up text-blue-500 text-xl"></i> Visão Geral
                        </h3>
                        <button type="button" onClick={handleAnalyzeAI} disabled={analyzingAI} className="text-xs flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-3 py-1.5 rounded-lg hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer border border-white/10 hover:scale-105">
                            <i className={`ph-fill ${analyzingAI ? 'ph-spinner animate-spin' : 'ph-magic-wand'}`}></i> {analyzingAI ? 'Analisando...' : 'Análise Inteligente'}
                        </button>
                    </div>

                    {/* AI INSIGHTS */}
                    {showAI && (
                        <div className="mb-6 ai-border bg-gray-900/90 rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><i className="ph-fill ph-brain text-6xl text-white"></i></div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <h4 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 uppercase flex items-center gap-2">
                                    <i className="ph-fill ph-sparkle text-blue-400"></i> Insights Estratégicos
                                </h4>
                                <button type="button" onClick={() => setShowAI(false)} className="text-gray-500 hover:text-white"><i className="ph-bold ph-x"></i></button>
                            </div>
                            <div className="ai-analytics-content prose text-gray-300 text-sm relative z-10" dangerouslySetInnerHTML={{ __html: aiHTML }} />
                            <button onClick={() => exportAIReport(metrics.aiMetrics, aiHTML, showToast)} className="mt-4 w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] border border-white/10 shadow-lg shadow-green-900/20">
                                <i className="ph-bold ph-file-pdf"></i> Exportar Relatório em PDF
                            </button>
                        </div>
                    )}

                    {/* KPI GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 relative z-10">
                        {/* Revenue Card (5 cols) */}
                        <div className="lg:col-span-5 glass-panel p-5 rounded-xl border-t-4 border-blue-500 clickable-card relative overflow-hidden flex flex-col md:flex-row gap-4 justify-between" onClick={() => filterByType('all')}>
                            <div className="relative z-10 flex flex-col justify-between h-full w-full md:w-1/2">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Faturamento Líquido Total</p>
                                    <h3 className="text-3xl lg:text-4xl font-bold text-white">{formatCurrency(metrics.total)}</h3>
                                </div>
                                <div className="mt-auto bg-black/40 p-3 rounded-lg border border-green-500/30 self-start md:mt-0 mt-4">
                                    <p className="text-[9px] text-green-500 uppercase tracking-wider mb-0.5"><i className="ph-fill ph-tag"></i> Ticket Médio (Procedimento)</p>
                                    <h3 className="text-xl font-bold text-white relative z-20">{metrics.ticketMedioProc > 0 ? formatCurrency(metrics.ticketMedioProc) : '--'}</h3>
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 h-32 md:h-full relative flex items-center justify-center opacity-80 pointer-events-none">
                                <canvas ref={revenueChartRef}></canvas>
                            </div>
                        </div>

                        {/* Grade 2x2 de Consultas e Procedimentos (7 cols) */}
                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Consultas */}
                            <div className={`glass-panel p-4 rounded-xl border-t-2 border-purple-500 clickable-card flex justify-between items-center ${activeTypeFilter === 'Consulta' ? 'active' : ''}`} onClick={() => filterByType('Consulta')}>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Vendas Consultas</p>
                                    <h3 className="text-3xl font-bold text-white">{metrics.cCon}</h3>
                                </div>
                                <div className="flex flex-col text-right text-[10px] text-purple-300 font-medium leading-relaxed">
                                    <span><b className="text-white font-bold text-xs">{metrics.conCF}</b> Cabo Frio</span>
                                    <span><b className="text-white font-bold text-xs">{metrics.conBarra}</b> Barra da Tijuca</span>
                                    <span><b className="text-white font-bold text-xs">{metrics.conOnline}</b> Online</span>
                                </div>
                            </div>

                            {/* Status Consultas */}
                            <div className="glass-panel p-4 rounded-xl border-t-2 border-purple-500 flex flex-col justify-center gap-1">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Status Consultas</p>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-green-400">Realizada</span>
                                    <span className="text-white font-mono">{metrics.statRealizada} <span className="text-gray-400 font-normal text-[9px]">({metrics.taxaConRealizada}%)</span></span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-yellow-400">Agendada</span>
                                    <span className="text-white font-mono">{metrics.statAgendada} <span className="text-gray-400 font-normal text-[9px]">({metrics.taxaConAgendada}%)</span></span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-red-400">Cancelada</span>
                                    <span className="text-white font-mono">
                                        {metrics.statCancelada} <span className="text-gray-400 font-normal text-[9px]">({metrics.taxaConCancelada}%)</span>
                                        {metrics.revenueConCancelado > 0 && (
                                            <span className="text-red-400 font-normal text-[9px] ml-1.5">• -{formatCurrency(metrics.revenueConCancelado)}</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Procedimentos */}
                            <div className={`glass-panel p-4 rounded-xl border-t-2 border-green-500 clickable-card flex justify-between items-center ${activeTypeFilter === 'Procedimento' ? 'active' : ''}`} onClick={() => filterByType('Procedimento')}>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Vendas Procedimentos</p>
                                    <h3 className="text-3xl font-bold text-white">{metrics.cPro}</h3>
                                    {metrics.statProcCancelada > 0 && (
                                        <p className="text-[9px] text-gray-400 mt-0.5">({metrics.cProTotal} totais • {metrics.statProcCancelada} canc.)</p>
                                    )}
                                </div>
                                <div className="flex flex-col text-right text-[10px] text-green-300 font-medium leading-relaxed">
                                    <span><b className="text-white font-bold text-xs">{metrics.procCF}</b> Cabo Frio</span>
                                    <span><b className="text-white font-bold text-xs">{metrics.procBarra}</b> Barra da Tijuca</span>
                                </div>
                            </div>

                            {/* Status Procedimentos */}
                            <div className="glass-panel p-4 rounded-xl border-t-2 border-green-500 flex flex-col justify-center gap-1">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Status Procedimentos</p>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-green-400">Realizado</span>
                                    <span className="text-white font-mono">{metrics.statProcRealizada} <span className="text-gray-400 font-normal text-[9px]">({metrics.taxaProcRealizado}%)</span></span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-yellow-400">Agendado</span>
                                    <span className="text-white font-mono">{metrics.statProcAgendada} <span className="text-gray-400 font-normal text-[9px]">({metrics.taxaProcAgendado}%)</span></span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-red-400">Cancelado</span>
                                    <span className="text-white font-mono">
                                        {metrics.statProcCancelada} <span className="text-gray-400 font-normal text-[9px]">({metrics.taxaProcCancelamento}%)</span>
                                        {metrics.revenueProcCancelado > 0 && (
                                            <span className="text-red-400 font-normal text-[9px] ml-1.5">• -{formatCurrency(metrics.revenueProcCancelado)}</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ciclos Sequenciais (Preservados exatamente na ordem) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="glass-panel p-3 rounded-xl border-l-4 border-purple-500 bg-purple-900/10 flex flex-col justify-center">
                            <p className="text-[9px] text-purple-500 uppercase tracking-wider mb-1 leading-tight"><i className="ph-bold ph-timer"></i> Ciclo (Lead &gt; Consulta)</p>
                            <h3 className="text-lg font-bold text-white">{metrics.avgCon !== null ? metrics.avgCon + ' dias' : '--'}</h3>
                        </div>
                        <div className="glass-panel p-3 rounded-xl border-l-4 border-pink-500 bg-pink-900/10 flex flex-col justify-center">
                            <p className="text-[9px] text-pink-500 uppercase tracking-wider mb-1 leading-tight"><i className="ph-bold ph-timer"></i> Ciclo (Lead &gt; Procedimento)</p>
                            <h3 className="text-lg font-bold text-white">{metrics.avgPro !== null ? metrics.avgPro + ' dias' : '--'}</h3>
                        </div>
                        <div className="glass-panel p-3 rounded-xl border-l-4 border-cyan-500 bg-cyan-900/10 flex flex-col justify-center">
                            <p className="text-[9px] text-cyan-500 uppercase tracking-wider mb-1 leading-tight"><i className="ph-bold ph-clock-clockwise"></i> Consulta &gt; Procedimento</p>
                            <h3 className="text-lg font-bold text-white">{metrics.avgConsToProc !== null ? metrics.avgConsToProc + ' dias' : '--'}</h3>
                        </div>
                    </div>

                    {/* FUNIL CASCATA GLOBAL DA OPERAÇÃO (TODA A CLÍNICA - VISÃO GERAL) */}
                    <div className="glass-panel p-6 md:p-8 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/20 via-slate-900/40 to-purple-950/20 mb-6 shadow-xl relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-gray-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-600/20 p-2.5 rounded-xl text-blue-400">
                                    <i className="ph-fill ph-funnel text-2xl"></i>
                                </div>
                                <div>
                                    <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        Consolidado Global da Operação — Toda a Clínica
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        Funil real de conversão de ponta a ponta (Mulheres + Homens • Todas as Unidades)
                                    </p>
                                </div>
                            </div>
                            <span className="text-[10px] text-blue-300 font-mono bg-blue-900/30 border border-blue-700/40 px-3 py-1 rounded-full self-start sm:self-auto">
                                100% da Operação
                            </span>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            {/* Etapa 1: LEADS (100% largura) */}
                            <div className="w-full bg-gradient-to-r from-blue-950/50 via-blue-900/20 to-black/40 border border-blue-500/30 p-5 md:p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                                <div className="text-center sm:text-left space-y-1">
                                    <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block">1. Leads Totais</span>
                                    <span className="text-xs text-gray-400 block">
                                        Investimento Real (+12,15%): <strong className="text-white font-mono text-sm">{formatCurrency(metrics.totalInvestReal)}</strong>
                                        <span className="mx-2 text-gray-600">•</span>
                                        CPL Médio: <strong className="text-blue-300 font-mono text-sm">{formatCurrency(metrics.cpl)}</strong>
                                    </span>
                                </div>
                                <div className="text-center sm:text-right">
                                    <span className="text-3xl lg:text-4xl font-extrabold text-white font-mono tracking-tight">
                                        {metrics.totalLeadsCount} <span className="text-sm font-semibold text-gray-500 uppercase ml-1">Leads</span>
                                    </span>
                                </div>
                            </div>

                            {/* Chevron 1 */}
                            <div className="flex flex-col items-center my-0.5">
                                <div className="flex items-center gap-2 bg-purple-900/40 border border-purple-500/30 px-4 py-1.5 rounded-full text-xs font-bold text-purple-300 font-mono shadow-md">
                                    <i className="ph-bold ph-arrow-down"></i> Conversão Lead ➔ Consulta: {parseFloat(metrics.convLeadParaConsulta).toFixed(1)}%
                                </div>
                            </div>

                            {/* Etapa 2: CONSULTAS (95% largura) */}
                            <div className="w-full md:w-[95%] mx-auto bg-gradient-to-r from-purple-950/50 via-purple-900/20 to-black/40 border border-purple-500/30 p-5 md:p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between gap-3">
                                <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="text-center sm:text-left space-y-1">
                                        <span className="text-xs text-purple-400 font-bold uppercase tracking-wider block">2. Consultas Agendadas & Realizadas</span>
                                        <span className="text-xs text-gray-400 block">
                                            CPA Consulta: <strong className="text-purple-300 font-mono text-sm">{formatCurrency(metrics.cpaCon)}</strong>
                                            <span className="mx-2 text-gray-600">•</span>
                                            Taxa Comparecimento: <strong className="text-emerald-400 font-mono text-sm">{metrics.statRealizada} Realizadas ({metrics.taxaConRealizada}%)</strong>
                                        </span>
                                    </div>
                                    <div className="text-center sm:text-right">
                                        <span className="text-3xl lg:text-4xl font-extrabold text-white font-mono tracking-tight">
                                            {metrics.cCon} <span className="text-sm font-semibold text-gray-500 uppercase ml-1">Consultas</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Safra / Origem do Lead (Lead ➔ Consulta) */}
                                {metrics.cohortCon && metrics.cohortCon.totalComData > 0 && (
                                    <div className="pt-2.5 border-t border-purple-500/20 flex flex-wrap items-center gap-2 text-xs">
                                        <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
                                            <i className="ph-bold ph-calendar-blank"></i> Safra do Lead:
                                        </span>
                                        <span className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1.5 shadow-sm" title="Leads convertidos no mesmo mês ou em até 30 dias">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                            <span>Mês / ≤30d: <strong>{metrics.cohortCon.mes}</strong> ({metrics.cohortCon.mesPct}%)</span>
                                        </span>
                                        <span className="bg-blue-950/60 border border-blue-500/40 text-blue-300 px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1.5 shadow-sm" title="Leads convertidos entre 31 e 60 dias (Reativação recente)">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                            <span>+30 dias: <strong>{metrics.cohortCon.d30}</strong> ({metrics.cohortCon.d30Pct}%)</span>
                                        </span>
                                        <span className="bg-purple-950/60 border border-purple-500/40 text-purple-300 px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1.5 shadow-sm" title="Leads convertidos após 60 dias (Reativação de base antiga)">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                            <span>+60 dias: <strong>{metrics.cohortCon.d60}</strong> ({metrics.cohortCon.d60Pct}%)</span>
                                        </span>
                                        {metrics.cohortCon.semData > 0 && (
                                            <span className="text-[10px] text-gray-500 ml-auto font-mono">
                                                ({metrics.cohortCon.semData} sem data lead)
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Chevron 2 */}
                            <div className="flex flex-col items-center my-0.5">
                                <div className="flex items-center gap-2 bg-pink-900/40 border border-pink-500/30 px-4 py-1.5 rounded-full text-xs font-bold text-pink-300 font-mono shadow-md">
                                    <i className="ph-bold ph-arrow-down"></i> Conversão Consulta ➔ Procedimento: {parseFloat(metrics.convConsultaParaProc).toFixed(1)}%
                                </div>
                            </div>

                            {/* Etapa 3: PROCEDIMENTOS (90% largura) */}
                            <div className="w-full md:w-[90%] mx-auto bg-gradient-to-r from-pink-950/50 via-pink-900/20 to-black/40 border border-pink-500/30 p-5 md:p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between gap-3">
                                <div className="absolute top-0 left-0 w-2 h-full bg-pink-500"></div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="text-center sm:text-left space-y-1">
                                        <span className="text-xs text-pink-400 font-bold uppercase tracking-wider block">3. Procedimentos Vendidos (Válidos)</span>
                                        <span className="text-xs text-gray-400 block">
                                            CPA Procedimento: <strong className="text-pink-300 font-mono text-sm">{formatCurrency(metrics.cpaPro)}</strong>
                                            {metrics.statProcCancelada > 0 && (
                                                <>
                                                    <span className="mx-2 text-gray-600">•</span>
                                                    Cancelados: <strong className="text-red-400 font-mono text-xs">{metrics.statProcCancelada} ({metrics.taxaProcCancelamento}%) [-{formatCurrency(metrics.revenueProcCancelado)}]</strong>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <div className="text-center sm:text-right">
                                        <span className="text-3xl lg:text-4xl font-extrabold text-white font-mono tracking-tight">
                                            {metrics.cPro} <span className="text-sm font-semibold text-gray-500 uppercase ml-1">Vendas</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Safra / Origem da Consulta ao Procedimento */}
                                {metrics.cohortProcCons && metrics.cohortProcCons.totalComData > 0 && (
                                    <div className="pt-2.5 border-t border-pink-500/20 flex flex-wrap items-center gap-2 text-xs">
                                        <span className="text-[10px] text-pink-300 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
                                            <i className="ph-bold ph-calendar-blank"></i> Da Consulta ao Fechamento:
                                        </span>
                                        <span className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1.5 shadow-sm" title="Procedimentos fechados no mesmo mês ou em até 30 dias após a consulta">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                            <span>Mês / ≤30d: <strong>{metrics.cohortProcCons.mes}</strong> ({metrics.cohortProcCons.mesPct}%)</span>
                                        </span>
                                        <span className="bg-blue-950/60 border border-blue-500/40 text-blue-300 px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1.5 shadow-sm" title="Procedimentos fechados entre 31 e 60 dias após a consulta">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                            <span>+30 dias: <strong>{metrics.cohortProcCons.d30}</strong> ({metrics.cohortProcCons.d30Pct}%)</span>
                                        </span>
                                        <span className="bg-pink-950/60 border border-pink-500/40 text-pink-300 px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1.5 shadow-sm" title="Procedimentos fechados após 60 dias da consulta (Maturação longa)">
                                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                                            <span>+60 dias: <strong>{metrics.cohortProcCons.d60}</strong> ({metrics.cohortProcCons.d60Pct}%)</span>
                                        </span>
                                        {metrics.cohortProcCons.semData > 0 && (
                                            <span className="text-[10px] text-gray-500 ml-auto font-mono">
                                                ({metrics.cohortProcCons.semData} sem data consulta)
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Chevron 3 */}
                            <div className="flex flex-col items-center my-0.5">
                                <div className="flex items-center gap-2 bg-emerald-900/40 border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-300 font-mono shadow-md">
                                    <i className="ph-bold ph-arrow-down"></i> Ticket Médio Real: {formatCurrency(metrics.ticketMedioProc)}
                                </div>
                            </div>

                            {/* Etapa 4: FATURAMENTO (85% largura) */}
                            <div className="w-full md:w-[85%] mx-auto bg-gradient-to-r from-emerald-950/40 via-emerald-900/15 to-black/50 border border-emerald-500/40 p-5 md:p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                                <div className="text-center sm:text-left space-y-1">
                                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">4. Faturamento Líquido Real</span>
                                    <span className="text-xs text-gray-400 block">
                                        ROAS Consolidado: <strong className="text-emerald-300 font-mono text-sm">{metrics.totalInvestReal > 0 ? (metrics.total / metrics.totalInvestReal).toFixed(1) + 'x' : '--'}</strong>
                                        <span className="mx-2 text-gray-600">•</span>
                                        Retorno p/ Lead (RPL): <strong className="text-gray-300 font-mono text-xs">{formatCurrency(metrics.rpl)}</strong>
                                    </span>
                                </div>
                                <div className="text-center sm:text-right">
                                    <span className="text-3xl lg:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight">
                                        {formatCurrency(metrics.total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* CHARTS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-0">
                        <div className="glass-panel p-4 rounded-xl"><h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Faturamento por Origem</h4><div className="h-40 relative"><canvas ref={sourceChartRef}></canvas></div></div>
                        <div className="glass-panel p-4 rounded-xl"><h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Top 5 Criativos (R$)</h4><div className="h-40 relative"><canvas ref={tagsChartRef}></canvas></div></div>
                    </div>

                    {/* MARKETING SECTION */}
                    <div className="flex justify-between items-center mt-6 border-b border-gray-800 pb-3 mb-4">
                        <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2"><i className="ph-fill ph-megaphone text-orange-500 text-xl"></i> Marketing</h3>
                        <button onClick={() => setShowMktModal(true)} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-105">
                            <i className="ph-bold ph-plus"></i> Lançar Investimento
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="md:col-span-2 md:row-span-2 glass-panel p-5 rounded-xl border-t-4 border-orange-500 flex flex-col h-full relative overflow-hidden">
                            <div className="flex justify-between items-start z-10 relative h-full">
                                <div className="flex flex-col justify-between h-full w-full md:w-3/5">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Investimento Total</p>
                                        <h3 className="text-3xl font-bold text-white mb-2">{formatCurrency(metrics.totalInvestReal)}</h3>
                                    </div>
                                    
                                    <div className="space-y-2 mt-3">
                                        {/* Distribuição por Objetivo */}
                                        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                            <div className="flex-1">
                                                <p className="text-[9px] text-teal-400 uppercase tracking-wider mb-0.5 font-bold"><i className="ph-fill ph-target"></i> Leads (Vendas)</p>
                                                <p className="text-xs font-bold text-white">{formatCurrency(metrics.vendasInvestReal)}</p>
                                            </div>
                                            <div className="w-px bg-gray-800 self-stretch"></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] text-indigo-400 uppercase tracking-wider mb-0.5 font-bold"><i className="ph-fill ph-eye"></i> Branding (Engaj.)</p>
                                                <p className="text-xs font-bold text-white">{formatCurrency(metrics.engajamentoInvestReal)}</p>
                                            </div>
                                        </div>

                                        {/* Detalhe de Custos */}
                                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-lg border border-white/10">
                                            <div>
                                                <p className="text-[9px] text-orange-400 uppercase tracking-wider mb-0.5">Mídia (Ads)</p>
                                                <p className="text-xs font-bold text-orange-300">{formatCurrency(metrics.totalInvest)}</p>
                                            </div>
                                            <div className="h-6 w-px bg-gray-700"></div>
                                            <div>
                                                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Imposto (+12,15%)</p>
                                                <p className="text-xs font-bold text-gray-300">{formatCurrency(metrics.taxAmount)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-32 w-32 relative hidden md:block"><canvas ref={mktPieRef}></canvas></div>
                            </div>
                        </div>
                        <div className="glass-panel p-4 rounded-xl border-t-2 border-orange-500 flex flex-col justify-center">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Leads Totais</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{metrics.totalLeadsCount}</h3>
                        </div>
                        <div className="glass-panel p-4 rounded-xl border-t-2 border-orange-500 flex flex-col justify-center">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">CPL Médio</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(metrics.cpl)}</h3>
                            <p className="text-[9px] text-gray-500 mt-1">
                                {filterCampaignObjective === 'all' ? 'Todos os objetivos' : filterCampaignObjective === 'vendas' ? 'Foco em Vendas' : 'Foco em Engajamento'}
                            </p>
                        </div>
                        <div className="glass-panel p-4 rounded-xl bg-blue-900/10 border border-blue-500/30 flex flex-col justify-center">
                            <div className="flex justify-between items-center mb-1"><p className="text-[9px] text-blue-400 uppercase font-bold tracking-widest"><i className="ph-fill ph-meta-logo"></i> Meta Ads</p><span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">CPL: {formatCurrency(metrics.metaCPL)}</span></div>
                            <h4 className="text-xl font-bold text-white">{formatCurrency(metrics.metaInvestReal)}</h4>
                            <p className="text-[9px] text-gray-500 mt-1">{metrics.metaLeads} Leads gerados</p>
                        </div>
                        <div className="glass-panel p-4 rounded-xl bg-orange-900/10 border border-orange-500/30 flex flex-col justify-center">
                            <div className="flex justify-between items-center mb-1"><p className="text-[9px] text-orange-400 uppercase font-bold tracking-widest"><i className="ph-fill ph-google-logo"></i> Google Ads</p><span className="text-[9px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded font-mono">CPL: {formatCurrency(metrics.googleCPL)}</span></div>
                            <h4 className="text-xl font-bold text-white">{formatCurrency(metrics.googleInvestReal)}</h4>
                            <p className="text-[9px] text-gray-500 mt-1">{metrics.googleLeads} Leads gerados</p>
                        </div>
                    </div>

                    {/* FUNIL DETALHADO (POR UNIDADE E GÊNERO) */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <i className="ph-fill ph-funnel text-xl text-blue-400"></i>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Conversão Cruzada por Gênero e Unidade</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* --- LINHA 1: BARRA --- */}
                            <FunnelCard 
                                title="Barra (RJ) - Mulheres" 
                                icon={<><i className="ph-fill ph-map-pin"></i> 👩</>}
                                borderColor="border-emerald-500" 
                                iconColor="text-emerald-400" 
                                bgHeaderClass="bg-gradient-to-br from-emerald-950/20 to-transparent"
                                leads={metrics.leadsRJ_Mulher} 
                                invest={metrics.investRealRJ_Mulher} 
                                cpl={metrics.cplRJ_Mulher} 
                                cons={metrics.conRJ_Mulher} 
                                realCons={metrics.realConRJ_Mulher} 
                                procs={metrics.procRJ_Mulher} 
                                revenueProc={metrics.revenueProcRJ_Mulher}
                                revenueCons={metrics.revenueConRJ_Mulher}
                            />
                            
                            <FunnelCard 
                                title="Barra (RJ) - Homens" 
                                icon={<><i className="ph-fill ph-map-pin"></i> 👨</>}
                                borderColor="border-emerald-600" 
                                iconColor="text-emerald-500" 
                                bgHeaderClass="bg-gradient-to-br from-emerald-950/10 to-transparent"
                                leads={metrics.leadsRJ_Homem} 
                                invest={metrics.investRealRJ_Homem} 
                                cpl={metrics.cplRJ_Homem} 
                                cons={metrics.conRJ_Homem} 
                                realCons={metrics.realConRJ_Homem} 
                                procs={metrics.procRJ_Homem} 
                                revenueProc={metrics.revenueProcRJ_Homem}
                                revenueCons={metrics.revenueConRJ_Homem}
                            />

                            <FunnelCard 
                                title="Barra (RJ) - Agregado" 
                                icon={<><i className="ph-fill ph-map-pin"></i> 👥</>}
                                borderColor="border-emerald-400" 
                                iconColor="text-emerald-300" 
                                bgHeaderClass="bg-gradient-to-br from-emerald-900/30 to-transparent"
                                leads={metrics.leadsRJ_Mulher + metrics.leadsRJ_Homem} 
                                invest={metrics.investRealRJ_Mulher + metrics.investRealRJ_Homem} 
                                cpl={(metrics.investRealRJ_Mulher + metrics.investRealRJ_Homem) / Math.max(1, metrics.leadsRJ_Mulher + metrics.leadsRJ_Homem)} 
                                cons={metrics.conRJ_Mulher + metrics.conRJ_Homem} 
                                realCons={metrics.realConRJ_Mulher + metrics.realConRJ_Homem} 
                                procs={metrics.procRJ_Mulher + metrics.procRJ_Homem} 
                                revenueProc={metrics.revenueProcRJ_Mulher + metrics.revenueProcRJ_Homem}
                                revenueCons={metrics.revenueConRJ_Mulher + metrics.revenueConRJ_Homem}
                            />

                            {/* --- LINHA 2: CABO FRIO --- */}
                            <FunnelCard 
                                title="Cabo Frio - Mulheres" 
                                icon={<><i className="ph-fill ph-map-pin"></i> 👩</>}
                                borderColor="border-cyan-500" 
                                iconColor="text-cyan-400" 
                                bgHeaderClass="bg-gradient-to-br from-cyan-950/20 to-transparent"
                                leads={metrics.leadsCF_Mulher} 
                                invest={metrics.investRealCF_Mulher} 
                                cpl={metrics.cplCF_Mulher} 
                                cons={metrics.conCF_Mulher} 
                                realCons={metrics.realConCF_Mulher} 
                                procs={metrics.procCF_Mulher} 
                                revenueProc={metrics.revenueProcCF_Mulher}
                                revenueCons={metrics.revenueConCF_Mulher}
                            />

                            <FunnelCard 
                                title="Cabo Frio - Homens" 
                                icon={<><i className="ph-fill ph-map-pin"></i> 👨</>}
                                borderColor="border-cyan-600" 
                                iconColor="text-cyan-500" 
                                bgHeaderClass="bg-gradient-to-br from-cyan-950/10 to-transparent"
                                leads={metrics.leadsCF_Homem} 
                                invest={metrics.investRealCF_Homem} 
                                cpl={metrics.cplCF_Homem} 
                                cons={metrics.conCF_Homem} 
                                realCons={metrics.realConCF_Homem} 
                                procs={metrics.procCF_Homem} 
                                revenueProc={metrics.revenueProcCF_Homem}
                                revenueCons={metrics.revenueConCF_Homem}
                            />

                            <FunnelCard 
                                title="Cabo Frio - Agregado" 
                                icon={<><i className="ph-fill ph-map-pin"></i> 👥</>}
                                borderColor="border-cyan-400" 
                                iconColor="text-cyan-300" 
                                bgHeaderClass="bg-gradient-to-br from-cyan-900/30 to-transparent"
                                leads={metrics.leadsCF_Mulher + metrics.leadsCF_Homem} 
                                invest={metrics.investRealCF_Mulher + metrics.investRealCF_Homem} 
                                cpl={(metrics.investRealCF_Mulher + metrics.investRealCF_Homem) / Math.max(1, metrics.leadsCF_Mulher + metrics.leadsCF_Homem)} 
                                cons={metrics.conCF_Mulher + metrics.conCF_Homem} 
                                realCons={metrics.realConCF_Mulher + metrics.realConCF_Homem} 
                                procs={metrics.procCF_Mulher + metrics.procCF_Homem} 
                                revenueProc={metrics.revenueProcCF_Mulher + metrics.revenueProcCF_Homem}
                                revenueCons={metrics.revenueConCF_Mulher + metrics.revenueConCF_Homem}
                            />

                            {/* --- LINHA 3: ONLINE --- */}
                            <FunnelCard 
                                hideLeads={true}
                                title="Online - Mulheres" 
                                icon={<><i className="ph-fill ph-globe"></i> 👩</>}
                                borderColor="border-purple-500" 
                                iconColor="text-purple-400" 
                                bgHeaderClass="bg-gradient-to-br from-purple-950/20 to-transparent"
                                leads={0} invest={0} cpl={0} 
                                cons={metrics.conOnline_Mulher} 
                                realCons={metrics.realConOnline_Mulher} 
                                procs={metrics.procOnline_Mulher} 
                                revenueProc={metrics.revenueProcOnline_Mulher}
                                revenueCons={metrics.revenueConOnline_Mulher}
                            />

                            <FunnelCard 
                                hideLeads={true}
                                title="Online - Homens" 
                                icon={<><i className="ph-fill ph-globe"></i> 👨</>}
                                borderColor="border-purple-600" 
                                iconColor="text-purple-500" 
                                bgHeaderClass="bg-gradient-to-br from-purple-950/10 to-transparent"
                                leads={0} invest={0} cpl={0} 
                                cons={metrics.conOnline_Homem} 
                                realCons={metrics.realConOnline_Homem} 
                                procs={metrics.procOnline_Homem} 
                                revenueProc={metrics.revenueProcOnline_Homem}
                                revenueCons={metrics.revenueConOnline_Homem}
                            />

                            <FunnelCard 
                                hideLeads={true}
                                title="Online - Agregado" 
                                icon={<><i className="ph-fill ph-globe"></i> 👥</>}
                                borderColor="border-purple-400" 
                                iconColor="text-purple-300" 
                                bgHeaderClass="bg-gradient-to-br from-purple-900/30 to-transparent"
                                leads={0} invest={0} cpl={0} 
                                cons={metrics.conOnline_Mulher + metrics.conOnline_Homem} 
                                realCons={metrics.realConOnline_Mulher + metrics.realConOnline_Homem} 
                                procs={metrics.procOnline_Mulher + metrics.procOnline_Homem} 
                                revenueProc={metrics.revenueProcOnline_Mulher + metrics.revenueProcOnline_Homem}
                                revenueCons={metrics.revenueConOnline_Mulher + metrics.revenueConOnline_Homem}
                            />
                        </div>
                    </div>

                    {/* EVOLUTION CHART - COMBO (BARRAS DE TRÁFEGO + LINHAS DE FATURAMENTO E FUNIL) */}
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2">
                                <i className="ph-fill ph-trend-up text-xl text-blue-400"></i>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Evolução Temporal: Tráfego, Funil e Retorno</h3>
                                    <p className="text-[10px] text-gray-400">
                                        Tráfego em barras na base (R$) • Faturamento no topo (R$) • Funil de Vendas em linhas
                                    </p>
                                </div>
                            </div>

                            {/* Chavinha para Ativar/Desativar Rótulos com Valores */}
                            <button
                                type="button"
                                onClick={() => setShowDataLabels(prev => !prev)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer border ${
                                    showDataLabels 
                                        ? 'bg-blue-600/15 border-blue-500/40 text-blue-300 shadow-sm shadow-blue-900/30' 
                                        : 'bg-gray-900/70 border-gray-800 text-gray-400 hover:text-gray-300 hover:border-gray-700'
                                }`}
                                title="Ligar ou desligar os valores numéricos diretamente sobre as linhas e barras"
                            >
                                <span className="text-[11px] font-semibold text-gray-300">Rótulos no Gráfico:</span>
                                <div className={`w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${showDataLabels ? 'bg-blue-500' : 'bg-gray-700'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm ${showDataLabels ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <span className={`text-[11px] font-bold ${showDataLabels ? 'text-blue-400' : 'text-gray-500'}`}>
                                    {showDataLabels ? 'ON' : 'OFF'}
                                </span>
                            </button>
                        </div>

                        {/* Toggle metric chips */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            <span className="text-[10px] uppercase font-bold text-gray-500 mr-1">Métricas:</span>
                            {[
                                { key: 'faturamento', label: 'Faturamento', color: '#34d399', border: 'border-emerald-500/40', text: 'text-emerald-300', bg: 'bg-emerald-500/15' },
                                { key: 'investimento', label: 'Tráfego', color: '#38bdf8', border: 'border-sky-500/40', text: 'text-sky-300', bg: 'bg-sky-500/15' },
                                { key: 'leads', label: 'Leads', color: '#fbbf24', border: 'border-amber-500/40', text: 'text-amber-300', bg: 'bg-amber-500/15' },
                                { key: 'consultas', label: 'Consultas', color: '#f472b6', border: 'border-pink-500/40', text: 'text-pink-300', bg: 'bg-pink-500/15' },
                                { key: 'procedimentos', label: 'Procedimentos', color: '#c084fc', border: 'border-purple-500/40', text: 'text-purple-300', bg: 'bg-purple-500/15' },
                                { key: 'cpl', label: 'CPL Médio', color: '#818cf8', border: 'border-indigo-500/40', text: 'text-indigo-300', bg: 'bg-indigo-500/15' },
                            ].map(item => {
                                const active = visibleLines[item.key];
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => toggleLine(item.key)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                                            active 
                                                ? `${item.bg} ${item.border} ${item.text} shadow-sm shadow-black/30` 
                                                : 'bg-gray-900/60 border-gray-800 text-gray-500 opacity-60 hover:opacity-100 hover:text-gray-400'
                                        }`}
                                    >
                                        <span 
                                            className="w-2 h-2 rounded-full inline-block transition-transform" 
                                            style={{ backgroundColor: active ? item.color : '#6b7280', transform: active ? 'scale(1)' : 'scale(0.8)' }} 
                                        />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Chart Container - Altura aumentada para 500px */}
                        <div className="glass-panel p-5 rounded-2xl relative z-0 h-[500px] w-full flex flex-col justify-center">
                            {evolutionData.length > 0 ? (
                                (() => {
                                    const maxLeadsInPeriod = Math.max(...evolutionData.map(d => d.Leads || 0), 100);
                                    const maxConsInPeriod = Math.max(...evolutionData.map(d => d.Consultas || 0), 10);
                                    const maxFatInPeriod = Math.max(...evolutionData.map(d => d.Faturamento || 0), 1000);
                                    const maxInvestInPeriod = Math.max(...evolutionData.map(d => d.Investimento || 0), 100);

                                    return (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={evolutionData} margin={{ top: 20, right: 35, left: 10, bottom: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                                <XAxis dataKey="label" stroke="#6b7280" tick={{fontSize: 11}} tickMargin={12} />
                                                
                                                {/* Eixo Esquerdo Calibrado: Leads (escala suave para manter os leads entre 30% e 55% da altura) */}
                                                <YAxis 
                                                    yAxisId="leads" 
                                                    stroke="#6b7280" 
                                                    tick={{fontSize: 10}} 
                                                    width={40} 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    domain={[0, Math.round(maxLeadsInPeriod * 1.9)]}
                                                />
                                                
                                                {/* Eixo Direito: Faturamento em R$ (faixa superior de 50% a 95%) */}
                                                <YAxis 
                                                    yAxisId="revenue" 
                                                    orientation="right" 
                                                    stroke="#34d399" 
                                                    tick={{fontSize: 10}} 
                                                    width={65} 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    domain={[0, Math.round(maxFatInPeriod * 1.15)]}
                                                    tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} 
                                                />

                                                {/* Eixo Oculto Calibrado para Tráfego: Máximo em ~45% da altura com zero padding na base */}
                                                <YAxis 
                                                    yAxisId="traffic" 
                                                    hide={true} 
                                                    domain={[0, Math.round(maxInvestInPeriod * 2.2)]} 
                                                    padding={{ top: 0, bottom: 0 }}
                                                />

                                                {/* Eixo Oculto Calibrado para Consultas, Procedimentos e CPL: Máximo em ~38% da altura */}
                                                <YAxis 
                                                    yAxisId="funnelSub" 
                                                    hide={true} 
                                                    domain={[0, Math.round(maxConsInPeriod * 2.8)]} 
                                                />

                                                <RechartsTooltip 
                                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '10px', color: '#f3f4f6', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                                                    labelStyle={{ color: '#9ca3af', marginBottom: '8px', fontWeight: 'bold' }}
                                                    formatter={(value, name, item) => {
                                                        const p = item.payload;
                                                        if (name === 'Faturamento') {
                                                            return [formatCurrency(p.Faturamento), name];
                                                        }
                                                        if (name === 'Tráfego') {
                                                            return [formatCurrency(p.Investimento), name];
                                                        }
                                                        if (name === 'CPL Médio') {
                                                            return [formatCurrency(p.CPL), name];
                                                        }
                                                        if (name === 'Leads') {
                                                            return [`${p.Leads} leads`, name];
                                                        }
                                                        if (name === 'Consultas') {
                                                            return [`${p.Consultas} consultas`, name];
                                                        }
                                                        if (name === 'Procedimentos') {
                                                            return [`${p.Procedimentos} procedimentos`, name];
                                                        }
                                                        return [value, name];
                                                    }}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />

                                                {/* 1. Tráfego como BARRAS Elegantes na Base com Valores Diretos */}
                                                {visibleLines.investimento && (
                                                    <Bar 
                                                        yAxisId="traffic" 
                                                        dataKey="Investimento" 
                                                        name="Tráfego" 
                                                        fill="#38bdf8" 
                                                        fillOpacity={0.28} 
                                                        stroke="#38bdf8" 
                                                        strokeWidth={1.5} 
                                                        radius={[4, 4, 0, 0]} 
                                                        maxBarSize={30} 
                                                    >
                                                        {showDataLabels && (
                                                            <LabelList 
                                                                dataKey="Investimento" 
                                                                position="top" 
                                                                formatter={(val) => val > 0 ? `R$${(val/1000).toFixed(1)}k` : ''} 
                                                                style={{ fill: '#38bdf8', fontSize: '9px', fontWeight: 'bold' }} 
                                                            />
                                                        )}
                                                    </Bar>
                                                )}

                                                {/* 2. Faturamento como LINHA Marcante no Topo (50% a 95%) */}
                                                {visibleLines.faturamento && (
                                                    <Line 
                                                        yAxisId="revenue" 
                                                        type="monotone" 
                                                        dataKey="Faturamento" 
                                                        name="Faturamento" 
                                                        stroke="#34d399" 
                                                        strokeWidth={3} 
                                                        dot={{ r: 4, fill: '#111827', stroke: '#34d399', strokeWidth: 2 }} 
                                                        activeDot={{ r: 6 }} 
                                                    >
                                                        {showDataLabels && (
                                                            <LabelList 
                                                                dataKey="Faturamento" 
                                                                position="top" 
                                                                offset={10} 
                                                                formatter={(val) => val > 0 ? (val >= 1000 ? `R$${(val/1000).toFixed(0)}k` : `R$${val}`) : ''} 
                                                                style={{ fill: '#34d399', fontSize: '9px', fontWeight: 'bold' }} 
                                                            />
                                                        )}
                                                    </Line>
                                                )}

                                                {/* 3. Leads em LINHA na Faixa Intermediária (30% a 53%) */}
                                                {visibleLines.leads && (
                                                    <Line 
                                                        yAxisId="leads" 
                                                        type="monotone" 
                                                        dataKey="Leads" 
                                                        name="Leads" 
                                                        stroke="#fbbf24" 
                                                        strokeWidth={2.5} 
                                                        dot={{ r: 3, fill: '#111827' }} 
                                                        activeDot={{ r: 5 }} 
                                                    >
                                                        {showDataLabels && (
                                                            <LabelList 
                                                                dataKey="Leads" 
                                                                position="top" 
                                                                offset={8} 
                                                                formatter={(val) => val > 0 ? `${val}` : ''} 
                                                                style={{ fill: '#fbbf24', fontSize: '9px', fontWeight: 'bold' }} 
                                                            />
                                                        )}
                                                    </Line>
                                                )}

                                                {/* 4. Consultas, Procedimentos e CPL com ondulação visível */}
                                                {visibleLines.consultas && (
                                                    <Line 
                                                        yAxisId="funnelSub" 
                                                        type="monotone" 
                                                        dataKey="Consultas" 
                                                        name="Consultas" 
                                                        stroke="#f472b6" 
                                                        strokeWidth={2.5} 
                                                        dot={{ r: 3, fill: '#111827' }} 
                                                        activeDot={{ r: 5 }} 
                                                    >
                                                        {showDataLabels && (
                                                            <LabelList 
                                                                dataKey="Consultas" 
                                                                position="top" 
                                                                offset={8} 
                                                                formatter={(val) => val > 0 ? `${val}` : ''} 
                                                                style={{ fill: '#f472b6', fontSize: '9px', fontWeight: 'bold' }} 
                                                            />
                                                        )}
                                                    </Line>
                                                )}
                                                {visibleLines.procedimentos && (
                                                    <Line 
                                                        yAxisId="funnelSub" 
                                                        type="monotone" 
                                                        dataKey="Procedimentos" 
                                                        name="Procedimentos" 
                                                        stroke="#c084fc" 
                                                        strokeWidth={2.5} 
                                                        dot={{ r: 3, fill: '#111827' }} 
                                                        activeDot={{ r: 5 }} 
                                                    >
                                                        {showDataLabels && (
                                                            <LabelList 
                                                                dataKey="Procedimentos" 
                                                                position="top" 
                                                                offset={8} 
                                                                formatter={(val) => val > 0 ? `${val}` : ''} 
                                                                style={{ fill: '#c084fc', fontSize: '9px', fontWeight: 'bold' }} 
                                                            />
                                                        )}
                                                    </Line>
                                                )}
                                                {visibleLines.cpl && (
                                                    <Line 
                                                        yAxisId="funnelSub" 
                                                        type="monotone" 
                                                        dataKey="CPL" 
                                                        name="CPL Médio" 
                                                        stroke="#818cf8" 
                                                        strokeWidth={2} 
                                                        dot={{ r: 3, fill: '#111827' }} 
                                                        activeDot={{ r: 5 }} 
                                                    >
                                                        {showDataLabels && (
                                                            <LabelList 
                                                                dataKey="CPL" 
                                                                position="top" 
                                                                offset={8} 
                                                                formatter={(val) => val > 0 ? `R$${val.toFixed(0)}` : ''} 
                                                                style={{ fill: '#818cf8', fontSize: '9px', fontWeight: 'bold' }} 
                                                            />
                                                        )}
                                                    </Line>
                                                )}
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    );
                                })()
                            ) : (
                                <div className="text-center text-gray-500 text-sm">Nenhum dado disponível para o período selecionado.</div>
                            )}
                        </div>
                    </div>



                    {/* PERFORMANCE TABLE */}
                    <div className="glass-panel rounded-xl overflow-hidden relative z-0">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center cursor-pointer" onClick={() => setPerformanceOpen(!performanceOpen)}>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2"><i className="ph-fill ph-trophy text-yellow-500"></i> Performance Detalhada</h3>
                            <div className="flex items-center gap-2">
                                {activeTypeFilter !== 'all' && <span className="text-xs text-blue-400 font-mono">Filtro Ativo: {activeTypeFilter}</span>}
                                <i className={`ph-bold ${performanceOpen ? 'ph-caret-up' : 'ph-caret-down'} text-gray-500`}></i>
                            </div>
                        </div>
                        {performanceOpen && (
                            <div className="overflow-x-auto transition-all duration-300">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-900/80 uppercase font-bold text-gray-500">
                                        <tr><th className="px-4 py-3">Tag</th><th className="px-4 py-3">Campanha / Conjunto</th><th className="px-4 py-3">Criativo (Nome)</th><th className="px-4 py-3 text-center">Vendas</th><th className="px-4 py-3 text-center">Total (R$)</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50 text-gray-300">
                                        {sortedTags.map(tag => (
                                            <tr key={tag} onClick={() => setDetailsTag(tag)} className="performance-row hover:bg-blue-900/10 border-b border-gray-800/50">
                                                <td className="px-4 py-3 font-mono text-xs text-blue-400 underline decoration-dotted decoration-blue-700 cursor-pointer">{tag}</td>
                                                <td className="px-4 py-3 text-gray-400 text-[10px] truncate max-w-[120px]">{grouped[tag].campaign}<br /><span className="text-gray-600">{grouped[tag].adSet}</span></td>
                                                <td className="px-4 py-3 text-gray-300 text-xs truncate max-w-[200px]">{grouped[tag].creativeName}</td>
                                                <td className="px-4 py-3 text-center text-white">{grouped[tag].count}</td>
                                                <td className="px-4 py-3 text-center text-green-400 font-bold">{formatCurrency(grouped[tag].value)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {sortedTags.length === 0 && (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-600"><i className="ph ph-chart-bar text-4xl mb-2 opacity-50"></i><p>Sem dados para este filtro.</p></div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SALES LOG */}
                    <div className="glass-panel rounded-xl overflow-hidden opacity-80 hover:opacity-100 transition-opacity relative z-0">
                        <div className="p-3 bg-gray-900/50 border-b border-gray-800 flex justify-between items-center cursor-pointer" onClick={() => setLogOpen(!logOpen)}>
                            <h4 className="text-xs font-bold text-gray-400 uppercase">Histórico de Lançamentos (Log)</h4>
                            <i className={`ph-bold ${logOpen ? 'ph-caret-up' : 'ph-caret-down'} text-gray-500`}></i>
                        </div>
                        {logOpen && (
                            <div className="max-h-40 overflow-y-auto">
                                <table className="w-full text-left text-[10px] text-gray-500">
                                    <tbody className="divide-y divide-gray-800/30">
                                        {[...filteredSales].reverse().map((s, idx) => (
                                            <tr key={idx} className="cursor-pointer hover:bg-white/5 transition-colors border-b border-gray-800/30">
                                                <td className="px-4 py-3 text-gray-500 text-[10px]">{formatDateBR(s.date)}</td>
                                                <td className="px-4 py-3 text-white font-medium text-xs">{s.client || '-'}</td>
                                                <td className="px-4 py-3 text-gray-400 text-[10px]">{s.type}</td>
                                                <td className={`px-4 py-3 text-right font-mono text-xs ${s.status === 'Cancelado' ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(s.value)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* MARKETING MODAL */}
            <Modal active={showMktModal} className="max-w-md p-6 border border-orange-500/30">
                <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-white flex items-center gap-2"><i className="ph-fill ph-megaphone text-orange-500"></i> Lançar Marketing</h3><button onClick={() => setShowMktModal(false)} className="text-gray-400 hover:text-white"><i className="ph-bold ph-x text-lg"></i></button></div>
                <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                    <div className="flex gap-2">
                        <div className="flex-1"><label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Data Início</label><input type="date" value={mktStartDate} onChange={e => setMktStartDate(e.target.value)} className="input-field w-full rounded-lg p-2 text-sm text-gray-300" /></div>
                        <div className="flex-1"><label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Data Fim</label><input type="date" value={mktEndDate} onChange={e => setMktEndDate(e.target.value)} className="input-field w-full rounded-lg p-2 text-sm text-gray-300" /></div>
                    </div>
                    <div><label className="text-[10px] font-bold text-blue-300 uppercase mb-1 block">Campanha (Público)</label><select value={mktCampaign} onChange={e => setMktCampaign(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm cursor-pointer"><option value="Homem">Homem</option><option value="Mulher">Mulher</option><option value="Ambos">Ambos</option></select></div>
                    <div><label className="text-[10px] font-bold text-purple-300 uppercase mb-1 block">Local (Região)</label><select value={mktLocation} onChange={e => setMktLocation(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm cursor-pointer"><option value="Cabo Frio">Cabo Frio</option><option value="Barra da Tijuca">Barra da Tijuca</option><option value="Ambos">Ambos (Rateio 50/50)</option></select></div>
                    <div><label className="text-[10px] font-bold text-orange-400 uppercase mb-1 block">Investimento (R$)</label><input type="number" value={mktInvestment} onChange={e => setMktInvestment(e.target.value)} placeholder="0,00" className="input-field w-full rounded-lg p-3 text-sm" step="0.01" /></div>
                    <div><label className="text-[10px] font-bold text-blue-400 uppercase mb-1 block">Plataforma</label><select value={mktPlatform} onChange={e => setMktPlatform(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm cursor-pointer"><option value="Meta Ads">Meta Ads (Facebook/Instagram)</option><option value="Google Ads">Google Ads (Search/Youtube)</option></select></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Leads Gerados</label><input type="number" value={mktLeads} onChange={e => setMktLeads(e.target.value)} placeholder="0" className="input-field w-full rounded-lg p-3 text-sm" /></div>
                    <button type="button" onClick={handleAddMarketing} disabled={savingMkt} className={`w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold text-sm transition-all mt-4 ${savingMkt ? 'btn-loading' : ''}`}>{savingMkt ? 'Salvando...' : 'SALVAR DADOS'}</button>
                </form>
            </Modal>

            {/* DETAILS MODAL */}
            <Modal active={detailsTag !== null} className="max-w-2xl max-h-[80vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-800">
                    <div><h3 className="text-lg font-bold text-white flex items-center gap-2"><i className="ph-fill ph-list-magnifying-glass text-blue-500"></i> Detalhes das Vendas</h3><p className="text-xs text-blue-400 font-mono mt-1 uppercase">{detailsContext}</p></div>
                    <button onClick={() => setDetailsTag(null)} className="text-gray-400 hover:text-white cursor-pointer"><i className="ph-bold ph-x text-lg"></i></button>
                </div>
                <div className="p-0 overflow-y-auto flex-1">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-900/90 uppercase font-bold text-gray-400 sticky top-0">
                            <tr><th className="px-6 py-4">Data</th><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Vendedora</th><th className="px-6 py-4">Tipo</th><th className="px-6 py-4">Local</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Valor</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50 text-gray-300">
                            {detailsSales.map((s, idx) => (
                                <tr key={idx} className="hover:bg-blue-900/10 transition-colors">
                                    <td className="px-6 py-3">{formatDateBR(s.date)}</td>
                                    <td className="px-6 py-3 font-medium text-white">{s.client}</td>
                                    <td className="px-6 py-3 text-pink-400">{s.seller}</td>
                                    <td className="px-6 py-3"><div>{s.type}</div>{s.procedureDetail && <div className="text-[9px] text-gray-500">{s.procedureDetail}</div>}</td>
                                    <td className="px-6 py-3">{s.location}</td>
                                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded-full text-[10px] ${(s.status || '').includes('Cancelado') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>{s.status}</span></td>
                                    <td className="px-6 py-3 text-right font-mono text-green-400 font-bold">{formatCurrency(s.value)}</td>
                                </tr>
                            ))}
                            {detailsSales.length === 0 && <tr><td colSpan="7" className="px-6 py-6 text-center text-gray-500">Nenhuma venda listada para este contexto no período atual.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-gray-800 bg-black/20 flex justify-end"><button onClick={() => setDetailsTag(null)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white text-xs">Fechar</button></div>
            </Modal>
        </div>
    );
}
