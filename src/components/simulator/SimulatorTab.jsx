import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { getFilteredSales, getFilteredMarketing } from '../../utils/filters';
import { calculateMetrics } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

export default function SimulatorTab() {
    const { state, showToast } = useApp();
    const { sales, marketing, history, publics, procedures } = state;

    // Benchmark Period Filters
    const [period, setPeriod] = useState('month');
    const [filterStart, setFilterStart] = useState('');
    const [filterEnd, setFilterEnd] = useState('');
    const [filterLocation, setFilterLocation] = useState('');

    // Simulator states
    const [simMode, setSimMode] = useState('invest');
    const [simInvestValue, setSimInvestValue] = useState(10000);
    const [simLeadsValue, setSimLeadsValue] = useState(200);
    const [simCpl, setSimCpl] = useState(30);
    const [simConvLeadToCons, setSimConvLeadToCons] = useState(10);
    const [simConvConsToProc, setSimConvConsToProc] = useState(30);
    const [simTicketMedio, setSimTicketMedio] = useState(5000);
    const [simInitialized, setSimInitialized] = useState(false);

    // Compute filtered data for baseline benchmark
    const filters = { period, filterStart, filterEnd, filterType: 'all', activeTypeFilter: 'all', filterPublic: '', filterProc: '', filterSeller: '', filterSource: '', filterLocation, selectedCreativeFilter: '' };
    const filteredSales = getFilteredSales(sales, filters, history, publics, procedures);
    const mktData = getFilteredMarketing(marketing, period, filterStart, filterEnd, filterLocation, 'all');
    const periodLabel = period === 'month' ? 'Este Mês' : period === 'last_month' ? 'Mês Anterior' : period === 'year' ? 'Este Ano' : period === 'today' ? 'Hoje' : period === 'week' ? 'Esta Semana' : period === 'all' ? 'Todo o Período' : 'Personalizado';
    const metrics = calculateMetrics(filteredSales, mktData, periodLabel);

    // Simulation Calculations
    const leadsProjetados = simMode === 'invest' ? (simCpl > 0 ? simInvestValue / simCpl : 0) : simLeadsValue;
    const investimentoProjetado = simMode === 'invest' ? simInvestValue : simLeadsValue * simCpl;
    const consultasProjetadas = leadsProjetados * (simConvLeadToCons / 100);
    const procedimentosProjetados = consultasProjetadas * (simConvConsToProc / 100);
    const faturamentoProjetado = procedimentosProjetados * simTicketMedio;
    const roasProjetado = investimentoProjetado > 0 ? faturamentoProjetado / investimentoProjetado : 0;
    const cpaConsultaProjetado = consultasProjetadas > 0 ? investimentoProjetado / consultasProjetadas : 0;
    const cpaProcedimentoProjetado = procedimentosProjetados > 0 ? investimentoProjetado / procedimentosProjetados : 0;

    const applyRealRates = useCallback(() => {
        if (metrics) {
            setSimCpl(Number(metrics.cpl.toFixed(2)) || 30);
            setSimConvLeadToCons(parseFloat(metrics.convLeadParaConsulta) || 10);
            setSimConvConsToProc(parseFloat(metrics.convConsultaParaProc) || 30);
            setSimTicketMedio(Math.round(metrics.ticketMedioProc) || 5000);
            showToast("Taxas reais do período aplicadas!");
        }
    }, [metrics, showToast]);

    useEffect(() => {
        if (metrics && !simInitialized && metrics.cpl > 0) {
            setSimCpl(Number(metrics.cpl.toFixed(2)));
            setSimConvLeadToCons(parseFloat(metrics.convLeadParaConsulta) || 10);
            setSimConvConsToProc(parseFloat(metrics.convConsultaParaProc) || 30);
            setSimTicketMedio(Math.round(metrics.ticketMedioProc) || 5000);
            setSimInitialized(true);
        }
    }, [metrics, simInitialized]);

    return (
        <div className="w-full max-w-[1400px] space-y-8">
            
            {/* BENCHMARK HEADER CONTROLS */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 border border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-600/20 p-3 rounded-xl text-purple-400">
                        <i className="ph-fill ph-gauge text-2xl"></i>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Período de Referência (Métricas Reais)</h4>
                        <p className="text-xs text-gray-400 mt-1">As taxas de conversão de base serão importadas desse período para calibrar o simulador</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end">
                    <div className="min-w-[160px]">
                        <select value={period} onChange={e => setPeriod(e.target.value)} className="input-field w-full rounded-xl px-3 py-2.5 text-sm cursor-pointer">
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
                        <div className="flex gap-2">
                            <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="input-field rounded-xl px-3 py-2 text-sm" />
                            <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="input-field rounded-xl px-3 py-2 text-sm" />
                        </div>
                    )}
                    <div className="min-w-[180px]">
                        <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="input-field w-full rounded-xl px-3 py-2.5 text-sm cursor-pointer">
                            <option value="">Todas as Unidades</option>
                            <option value="Cabo Frio">Cabo Frio</option>
                            <option value="Barra da Tijuca">Barra da Tijuca</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* REAL PERFORMANCE BENCHMARK PREVIEW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* CPL Card */}
                <div className="glass-panel p-6 rounded-2xl border-l-4 border-orange-500 bg-orange-950/5 flex flex-col justify-between transition-all hover:bg-orange-950/10">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">CPL Real</p>
                    <h4 className="text-2xl font-bold text-orange-400 font-mono mt-2">{formatCurrency(metrics.cpl)}</h4>
                </div>
                {/* Lead -> Cons Card */}
                <div className="glass-panel p-6 rounded-2xl border-l-4 border-purple-500 bg-purple-950/5 flex flex-col justify-between transition-all hover:bg-purple-950/10">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Conversão Real Lead➔Cons.</p>
                    <h4 className="text-2xl font-bold text-purple-400 font-mono mt-2">{parseFloat(metrics.convLeadParaConsulta).toFixed(1)}%</h4>
                </div>
                {/* Cons -> Proc Card */}
                <div className="glass-panel p-6 rounded-2xl border-l-4 border-pink-500 bg-pink-950/5 flex flex-col justify-between transition-all hover:bg-pink-950/10">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Conversão Real Cons.➔Proc.</p>
                    <h4 className="text-2xl font-bold text-pink-400 font-mono mt-2">{parseFloat(metrics.convConsultaParaProc).toFixed(1)}%</h4>
                </div>
                {/* Ticket Card */}
                <div className="glass-panel p-6 rounded-2xl border-l-4 border-emerald-500 bg-emerald-950/5 flex flex-col justify-between transition-all hover:bg-emerald-950/10">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Ticket Médio Real</p>
                    <h4 className="text-2xl font-bold text-emerald-400 font-mono mt-2">{formatCurrency(metrics.ticketMedioProc)}</h4>
                </div>
            </div>

            {/* INTERACTIVE SIMULATOR */}
            <div className="glass-panel p-8 md:p-10 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-purple-950/20 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-gray-800 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600/20 p-3 rounded-xl text-blue-400"><i className="ph-fill ph-rocket-launch text-3xl"></i></div>
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Painel de Simulação Estratégica</h3>
                            <p className="text-sm text-gray-400 mt-1">Manipule as variáveis do funil livremente com maior precisão para projetar o retorno e custos operacionais</p>
                        </div>
                    </div>
                    <button type="button" onClick={applyRealRates} className="text-sm flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl border border-white/10 transition-all cursor-pointer font-bold shadow-lg shadow-blue-900/30 hover:scale-[1.02]">
                        <i className="ph-bold ph-arrow-counter-clockwise"></i> Importar Taxas da Referência
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Ajustes (Left - 5 Cols) */}
                    <div className="lg:col-span-5 space-y-6 lg:pr-8 lg:border-r lg:border-gray-800">
                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><i className="ph-fill ph-sliders"></i> Ajustes de Projeção</h4>
                        
                        {/* Modo de Simulação */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-300 uppercase font-bold tracking-wider block">Simular com base em:</label>
                            <div className="grid grid-cols-2 gap-3 bg-black/40 p-1.5 rounded-xl border border-white/5">
                                <button type="button" onClick={() => setSimMode('invest')} className={`py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${simMode === 'invest' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Investimento (R$)</button>
                                <button type="button" onClick={() => setSimMode('leads')} className={`py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${simMode === 'leads' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Leads (Qtd)</button>
                            </div>
                        </div>

                        {/* Valor de Entrada */}
                        {simMode === 'invest' ? (
                            <div className="space-y-2">
                                <label className="text-xs text-gray-300 uppercase font-bold tracking-wider block">Verba de Marketing (R$):</label>
                                <input type="number" value={simInvestValue} onChange={e => setSimInvestValue(Number(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold font-mono text-base focus:border-blue-500 outline-none" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-xs text-gray-300 uppercase font-bold tracking-wider block">Quantidade de Leads:</label>
                                <input type="number" value={simLeadsValue} onChange={e => setSimLeadsValue(Number(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold font-mono text-base focus:border-blue-500 outline-none" />
                            </div>
                        )}

                        {/* CPL Input/Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-gray-300 uppercase font-bold tracking-wider">Custo por Lead (CPL):</label>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-gray-500 font-mono font-bold">R$</span>
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        min="0"
                                        value={simCpl} 
                                        onChange={e => setSimCpl(parseFloat(e.target.value) || 0)} 
                                        className="w-20 bg-white/5 border border-white/15 rounded-lg py-1 px-2.5 text-sm text-orange-400 font-bold font-mono text-center outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <input type="range" min="5" max="150" step="0.5" value={simCpl} onChange={e => setSimCpl(Number(e.target.value))} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        </div>

                        {/* Taxa Conversão Lead -> Consulta Input/Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-gray-300 uppercase font-bold tracking-wider">Conversão Lead ➔ Consulta:</label>
                                <div className="flex items-center gap-1.5">
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        min="0" 
                                        max="100"
                                        value={simConvLeadToCons} 
                                        onChange={e => setSimConvLeadToCons(parseFloat(e.target.value) || 0)} 
                                        className="w-20 bg-white/5 border border-white/15 rounded-lg py-1 px-2.5 text-sm text-purple-400 font-bold font-mono text-center outline-none focus:border-purple-500"
                                    />
                                    <span className="text-xs text-gray-500 font-bold">%</span>
                                </div>
                            </div>
                            <input type="range" min="1" max="100" step="0.5" value={simConvLeadToCons} onChange={e => setSimConvLeadToCons(Number(e.target.value))} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        </div>

                        {/* Taxa Conversão Consulta -> Procedimento Input/Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-gray-300 uppercase font-bold tracking-wider">Conversão Consulta ➔ Proc:</label>
                                <div className="flex items-center gap-1.5">
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        min="0" 
                                        max="100"
                                        value={simConvConsToProc} 
                                        onChange={e => setSimConvConsToProc(parseFloat(e.target.value) || 0)} 
                                        className="w-20 bg-white/5 border border-white/15 rounded-lg py-1 px-2.5 text-sm text-pink-400 font-bold font-mono text-center outline-none focus:border-pink-500"
                                    />
                                    <span className="text-xs text-gray-500 font-bold">%</span>
                                </div>
                            </div>
                            <input type="range" min="1" max="100" step="0.5" value={simConvConsToProc} onChange={e => setSimConvConsToProc(Number(e.target.value))} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500" />
                        </div>

                        {/* Ticket Médio */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-300 uppercase font-bold tracking-wider block">Ticket Médio Procedimento (R$):</label>
                            <input type="number" value={simTicketMedio} onChange={e => setSimTicketMedio(Number(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold font-mono text-base focus:border-blue-500 outline-none" />
                        </div>
                    </div>

                    {/* Resultados Funil (Right - 7 Cols) */}
                    <div className="lg:col-span-7 flex flex-col space-y-6">
                        <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                            <i className="ph-fill ph-funnel"></i> Funil de Vendas Projetado
                        </h4>

                        <div className="flex flex-col gap-3 flex-1">
                            {/* Etapa 1: LEADS */}
                            <div className="w-full bg-gradient-to-r from-blue-950/40 via-blue-900/15 to-black/30 border border-blue-500/20 p-6 md:p-7 rounded-2xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                                <div className="text-center sm:text-left space-y-1">
                                    <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block">1. Leads Projetados</span>
                                    <span className="text-xs text-gray-400 block">Verba de Mídia: <strong className="text-white font-mono text-sm">{formatCurrency(investimentoProjetado)}</strong></span>
                                </div>
                                <div className="text-center sm:text-right">
                                    <span className="text-3xl lg:text-4xl font-extrabold text-white font-mono tracking-tight">{Math.round(leadsProjetados)} <span className="text-sm font-semibold text-gray-500 uppercase ml-1">Leads</span></span>
                                </div>
                            </div>

                            {/* Chevron 1 */}
                            <div className="flex flex-col items-center my-0.5">
                                <div className="flex items-center gap-2 bg-purple-900/35 border border-purple-500/25 px-4 py-1.5 rounded-full text-xs font-bold text-purple-300 font-mono shadow-md">
                                    <i className="ph-bold ph-arrow-down"></i> Conversão: {simConvLeadToCons.toFixed(1)}%
                                </div>
                            </div>

                            {/* Etapa 2: CONSULTAS */}
                            <div className="w-full md:w-[95%] mx-auto bg-gradient-to-r from-purple-950/40 via-purple-900/15 to-black/30 border border-purple-500/20 p-6 md:p-7 rounded-2xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
                                <div className="text-center sm:text-left space-y-1">
                                    <span className="text-xs text-purple-400 font-bold uppercase tracking-wider block">2. Consultas Agendadas</span>
                                    <span className="text-xs text-gray-400 block">CPA Consulta: <strong className="text-purple-300 font-mono text-sm">{formatCurrency(cpaConsultaProjetado)}</strong></span>
                                </div>
                                <div className="text-center sm:text-right">
                                    <span className="text-3xl lg:text-4xl font-extrabold text-white font-mono tracking-tight">{Math.round(consultasProjetadas)} <span className="text-sm font-semibold text-gray-500 uppercase ml-1">Consultas</span></span>
                                </div>
                            </div>

                            {/* Chevron 2 */}
                            <div className="flex flex-col items-center my-0.5">
                                <div className="flex items-center gap-2 bg-pink-900/35 border border-pink-500/25 px-4 py-1.5 rounded-full text-xs font-bold text-pink-300 font-mono shadow-md">
                                    <i className="ph-bold ph-arrow-down"></i> Conversão: {simConvConsToProc.toFixed(1)}%
                                </div>
                            </div>

                            {/* Etapa 3: PROCEDIMENTOS */}
                            <div className="w-full md:w-[90%] mx-auto bg-gradient-to-r from-pink-950/40 via-pink-900/15 to-black/30 border border-pink-500/20 p-6 md:p-7 rounded-2xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="absolute top-0 left-0 w-2 h-full bg-pink-500"></div>
                                <div className="text-center sm:text-left space-y-1">
                                    <span className="text-xs text-pink-400 font-bold uppercase tracking-wider block">3. Procedimentos Vendidos</span>
                                    <span className="text-xs text-gray-400 block">CPA Procedimento: <strong className="text-pink-300 font-mono text-sm">{formatCurrency(cpaProcedimentoProjetado)}</strong></span>
                                </div>
                                <div className="text-center sm:text-right">
                                    <span className="text-3xl lg:text-4xl font-extrabold text-white font-mono tracking-tight">{Math.round(procedimentosProjetados)} <span className="text-sm font-semibold text-gray-500 uppercase ml-1">Vendas</span></span>
                                </div>
                            </div>

                            {/* Chevron 3 */}
                            <div className="flex flex-col items-center my-0.5">
                                <div className="flex items-center gap-2 bg-emerald-900/35 border border-emerald-500/25 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-300 font-mono shadow-md">
                                    <i className="ph-bold ph-arrow-down"></i> Ticket Médio: {formatCurrency(simTicketMedio)}
                                </div>
                            </div>

                            {/* Etapa 4: FATURAMENTO */}
                            <div className="w-full md:w-[85%] mx-auto bg-gradient-to-r from-emerald-950/30 via-emerald-900/10 to-black/40 border border-emerald-500/30 p-6 md:p-7 rounded-2xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                                <div className="text-center sm:text-left space-y-1">
                                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">4. Faturamento Estimado</span>
                                    <span className="text-xs text-gray-400 block">ROAS Projetado: <strong className="text-emerald-300 font-mono text-sm">{roasProjetado.toFixed(1)}x</strong></span>
                                </div>
                                <div className="text-center sm:text-right">
                                    <span className="text-3xl lg:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight">{formatCurrency(faturamentoProjetado)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
