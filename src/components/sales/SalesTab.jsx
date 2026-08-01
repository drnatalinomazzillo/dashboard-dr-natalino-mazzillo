import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { addSale as apiAddSale } from '../../services/apiService';
import { formatDateBR, formatCurrency, normalizeDate, todayISO, calculateLeadTime } from '../../utils/formatters';
import CustomDropdown from '../common/CustomDropdown';
import EditSaleModal from './EditSaleModal';
import Modal from '../common/Modal';

export default function SalesTab() {
    const { state, dispatch, showToast, initData, getAllTags } = useApp();
    const { sales, procedures } = state;

    // Form state
    const [saleType, setSaleType] = useState('Consulta');
    const [saleProcedureDetail, setSaleProcedureDetail] = useState('');
    const [saleClient, setSaleClient] = useState('');
    const [saleLeadDate, setSaleLeadDate] = useState(todayISO());
    const [saleDate, setSaleDate] = useState(todayISO());
    const [saleConsultationDate, setSaleConsultationDate] = useState('');
    const [saleSource, setSaleSource] = useState('Tráfego Pago');
    const [saleTag, setSaleTag] = useState('');
    const [newTag, setNewTag] = useState('');
    const [showNewTag, setShowNewTag] = useState(false);
    const [saleLocation, setSaleLocation] = useState('Cabo Frio');
    const [saleStatus, setSaleStatus] = useState('Agendado');
    const [saleSeller, setSaleSeller] = useState('Amanda');
    const [saleValue, setSaleValue] = useState('');
    const [saleGender, setSaleGender] = useState('Mulher');
    const [saleEmail, setSaleEmail] = useState('');
    const [salePhone, setSalePhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // List state
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Edit modal
    const [editIndex, setEditIndex] = useState(null);

    // Single sale detail modal
    const [isCustomProcedure, setIsCustomProcedure] = useState(false);
    const [detailSale, setDetailSale] = useState(null);

    async function handleAddSale() {
        const date = saleDate;
        const leadDate = saleLeadDate;
        const client = saleClient.trim();
        const email = saleEmail.trim();
        const phone = salePhone.trim();
        const source = saleSource;
        const type = saleType;
        const seller = saleSeller;
        const value = parseFloat(saleValue);
        const procedureDetail = saleProcedureDetail;
        const consultationDate = saleConsultationDate;
        const location = saleLocation;
        const status = saleStatus;
        const gender = saleGender;

        let tag = 'ORGÂNICO';
        if (source === 'Tráfego Pago') {
            if (showNewTag) {
                tag = newTag.trim().toUpperCase();
                if (!tag) return alert("Digite TAG.");
                dispatch({ type: 'ADD_EXTRA_TAG', payload: tag });
            } else {
                tag = saleTag;
                if (!tag) return alert("Selecione TAG.");
            }
        } else if (source === 'Site' || source === 'SITE') tag = 'SITE';

        if (!date || isNaN(value) || !client) return alert("Preencha os campos obrigatórios.");
        if (!email || !phone) return alert("Preencha o E-mail e o Telefone da cliente (campos obrigatórios).");
        if (type === 'Procedimento' && (!procedureDetail || !consultationDate)) return alert("Preencha o procedimento vendido e a Data da Consulta.");

        const newSale = { date, leadDate, client, source, tag, type, seller, value, procedureDetail, location, status, consultationDate, gender, email, phone };

        setSaving(true);
        setSaveSuccess(false);
        try {
            await apiAddSale(newSale);
            dispatch({ type: 'ADD_SALE', payload: newSale });
            setSaleValue('');
            setSaleClient('');
            setSaleEmail('');
            setSalePhone('');
            setSaleGender('Mulher');
            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                initData();
            }, 1500);
        } catch (e) {
            console.error(e);
            showToast("Erro ao salvar", "error");
        }
        setSaving(false);
    }

    // Filter & sort sales
    const sortedSales = [...sales].reverse();
    const filteredSales = sortedSales.filter(s => {
        if (typeFilter && s.type !== typeFilter) return false;
        if (!searchTerm) return true;
        const txt = `${s.client} ${s.type} ${s.seller} ${s.status}`.toLowerCase();
        return txt.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="w-full max-w-[1400px]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start">

                {/* FORM (LEFT) */}
                <section className="lg:col-span-1 glass-panel rounded-2xl p-6 h-fit border-t-4 border-green-500 lg:sticky top-8 z-10">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <i className="ph-fill ph-money text-green-500"></i> Lançar Venda Real
                    </h2>
                    <form className="space-y-6" onSubmit={e => e.preventDefault()}>
                        <div>
                            <label className="text-[10px] font-bold text-purple-400 uppercase mb-1 block">O que foi vendido?</label>
                            <select value={saleType} onChange={e => { setSaleType(e.target.value); if (e.target.value !== 'Procedimento') setSaleProcedureDetail(''); }} className="input-field w-full rounded-lg p-3 text-sm cursor-pointer">
                                <option value="Consulta">Consulta</option>
                                <option value="Procedimento">Procedimento / Cirurgia</option>
                            </select>
                        </div>

                        {saleType === 'Procedimento' && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-bold text-purple-300 uppercase block">Qual Procedimento?</label>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setIsCustomProcedure(!isCustomProcedure);
                                            setSaleProcedureDetail('');
                                        }}
                                        className="text-[10px] text-purple-400 hover:text-purple-300 underline font-semibold cursor-pointer"
                                    >
                                        {isCustomProcedure ? '← Selecionar da Lista' : '✏️ Outro / Digitar'}
                                    </button>
                                </div>
                                {isCustomProcedure ? (
                                    <input 
                                        type="text" 
                                        value={saleProcedureDetail} 
                                        onChange={e => setSaleProcedureDetail(e.target.value)} 
                                        placeholder="Digite o nome do procedimento..." 
                                        className="input-field w-full rounded-lg p-3 text-sm border-l-4 border-l-purple-500" 
                                    />
                                ) : (
                                    <select 
                                        value={saleProcedureDetail} 
                                        onChange={e => {
                                            if (e.target.value === '__custom__') {
                                                setIsCustomProcedure(true);
                                                setSaleProcedureDetail('');
                                            } else {
                                                setSaleProcedureDetail(e.target.value);
                                            }
                                        }} 
                                        className="input-field w-full rounded-lg p-3 text-sm cursor-pointer border-l-4 border-l-purple-500"
                                    >
                                        <option value="">Selecione...</option>
                                        {procedures.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                                        <option value="__custom__">✏️ Outro (Digitar Novo...)</option>
                                    </select>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nome do Cliente <span className="text-red-400">*</span></label>
                            <input type="text" value={saleClient} onChange={e => setSaleClient(e.target.value)} placeholder="Ex: Maria Silva" className="input-field w-full rounded-lg p-3 text-sm" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-blue-400 uppercase mb-1 block">E-mail <span className="text-red-400">*</span></label>
                                <input type="email" value={saleEmail} onChange={e => setSaleEmail(e.target.value)} placeholder="maria@exemplo.com" className="input-field w-full rounded-lg p-3 text-xs" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-green-400 uppercase mb-1 block">Telefone / WhatsApp <span className="text-red-400">*</span></label>
                                <input type="tel" value={salePhone} onChange={e => setSalePhone(e.target.value)} placeholder="(22) 99999-8888" className="input-field w-full rounded-lg p-3 text-xs" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-yellow-500 uppercase mb-1 block">Data que virou Lead (Kommo)</label>
                            <input type="date" value={saleLeadDate} onChange={e => setSaleLeadDate(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm text-gray-300 cursor-pointer" />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Data da Venda</label>
                            <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm text-gray-300 cursor-pointer" />
                        </div>

                        {(saleType === 'Consulta' || saleType === 'Procedimento') && (
                            <div>
                                <label className="text-[10px] font-bold text-teal-400 uppercase mb-1 block">Data da Consulta</label>
                                <input type="date" value={saleConsultationDate} onChange={e => setSaleConsultationDate(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm text-gray-300 cursor-pointer" />
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Origem do Lead</label>
                            <select value={saleSource} onChange={e => setSaleSource(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm cursor-pointer">
                                <option value="Tráfego Pago">Tráfego Pago (Ads)</option>
                                <option value="Instagram">Instagram (Orgânico)</option>
                                <option value="SITE">SITE</option>
                                <option value="Orgânico">Orgânico</option>
                                <option value="Indicação">Indicação</option>
                                <option value="Paciente Antigo">Paciente Antigo</option>
                                <option value="Reativação Cliente">Reativação Cliente</option>
                                <option value="Reativação Vendedora">Reativação Vendedora</option>
                            </select>
                        </div>

                        {saleSource === 'Tráfego Pago' && (
                            <div className="relative z-20">
                                <label className="text-[10px] font-bold text-blue-400 uppercase mb-1 flex justify-between">
                                    <span>TAG de Rastreamento</span>
                                    <button type="button" onClick={() => setShowNewTag(!showNewTag)} className="text-[9px] text-blue-400 hover:text-white underline cursor-pointer">
                                        {showNewTag ? 'Selecionar Existente' : 'Criar Nova Tag'}
                                    </button>
                                </label>
                                {showNewTag ? (
                                    <div className="flex gap-2">
                                        <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="(Ref: NOVO-01)" className="input-field w-full rounded-lg p-3 text-sm font-mono uppercase" />
                                        <button type="button" onClick={() => setShowNewTag(false)} className="text-red-500 hover:text-red-400 px-2"><i className="ph-bold ph-x"></i></button>
                                    </div>
                                ) : (
                                    <CustomDropdown items={getAllTags()} value={saleTag} onChange={setSaleTag} placeholder="Buscar TAG..." />
                                )}
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-bold text-blue-300 uppercase mb-1 block">Local (Unidade)</label>
                            <select value={saleLocation} onChange={e => setSaleLocation(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm cursor-pointer">
                                <option value="Cabo Frio">Cabo Frio</option>
                                <option value="Barra da Tijuca">Barra da Tijuca</option>
                                <option value="Online">Online</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-pink-300 uppercase mb-1 block">Gênero</label>
                            <select value={saleGender} onChange={e => setSaleGender(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm cursor-pointer">
                                <option value="Mulher">Mulher</option>
                                <option value="Homem">Homem</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-yellow-300 uppercase mb-1 block">Status</label>
                            <select value={saleStatus} onChange={e => setSaleStatus(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm cursor-pointer">
                                <option value="Agendado">Agendado</option>
                                <option value="Realizado">Realizado</option>
                                <option value="Cancelado">Cancelado / Não Compareceu</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-pink-400 uppercase mb-1 block">Nome da Vendedora</label>
                            <select value={saleSeller} onChange={e => setSaleSeller(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm cursor-pointer">
                                <option value="Amanda">Amanda</option>
                                <option value="Daniele">Daniele</option>
                                <option value="Margo">Margo</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-green-400 uppercase mb-1 block">Valor Total (R$)</label>
                            <input type="number" value={saleValue} onChange={e => setSaleValue(e.target.value)} placeholder="0,00" className="input-field w-full rounded-lg p-3 text-sm text-white font-bold" step="0.01" />
                        </div>

                        <button
                            type="button"
                            onClick={handleAddSale}
                            disabled={saving}
                            className={`w-full py-3 rounded-lg text-white font-bold text-sm transition-all shadow-lg shadow-green-900/20 mt-4 flex justify-center items-center gap-2 cursor-pointer ${saveSuccess ? 'success-btn' : 'bg-green-600 hover:bg-green-500'} ${saving ? 'btn-loading' : ''}`}
                        >
                            <i className="ph-bold ph-check"></i> {saving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'REGISTRAR VENDA'}
                        </button>
                    </form>
                </section>

                {/* SALES HISTORY (RIGHT) */}
                <section className="lg:col-span-2 glass-panel rounded-2xl p-6 h-fit border-t-4 border-blue-500">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <i className="ph-fill ph-clock-counter-clockwise text-blue-500"></i> Histórico de Vendas
                        </h2>
                        <div className="flex gap-2 items-center">
                            <div className="relative">
                                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar venda..." className="input-field rounded-lg px-3 py-2 text-xs cursor-text w-48" autoComplete="off" />
                                <i className="ph ph-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none"></i>
                            </div>
                            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field rounded-lg px-3 py-2 text-xs cursor-pointer w-auto">
                                <option value="">Todos</option>
                                <option value="Consulta">Consulta</option>
                                <option value="Procedimento">Procedimento</option>
                            </select>
                        </div>
                    </div>

                    {filteredSales.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-600">
                            <i className="ph ph-ghost text-4xl mb-2 opacity-50"></i>
                            <p>Nenhuma venda encontrada.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[950px] overflow-y-auto pr-2">
                            {filteredSales.map((s, idx) => {
                                const realIndex = sales.indexOf(s);
                                const reverseIndex = sortedSales.indexOf(s);
                                const val = formatCurrency(s.value);
                                const dDate = formatDateBR(s.date);
                                const isCanceled = s.status === 'Cancelado' || s.status === 'Cancelado / Não Compareceu';
                                const statusColor = isCanceled ? 'text-red-400 bg-red-900/20' : (s.status === 'Realizado' ? 'text-green-400 bg-green-900/20' : 'text-yellow-400 bg-yellow-900/20');

                                return (
                                    <div key={idx} className={`bg-gray-900/60 border ${isCanceled ? 'border-red-900/30 opacity-60' : 'border-gray-800'} rounded-xl p-4 hover:border-blue-500/30 transition-colors relative group`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-white text-sm truncate max-w-[150px]" title={s.client}>{s.client || 'Sem Nome'}</h4>
                                                <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5"><i className="ph-bold ph-calendar"></i> {dDate}</p>
                                            </div>
                                            <span className={`text-[9px] font-bold px-2 py-1 rounded ${statusColor}`}>{s.status || 'Realizado'}</span>
                                        </div>
                                        <div className="text-lg font-bold text-green-400 font-mono mb-3">{val}</div>
                                        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 bg-black/20 p-2 rounded-lg mb-3">
                                            <div><span className="block uppercase text-[8px] text-gray-500">Tipo</span>{s.type}</div>
                                            <div className="text-right"><span className="block uppercase text-[8px] text-gray-500">Vendedora</span><span className="text-pink-400 font-bold">{s.seller}</span></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setDetailSale(s)} title="Detalhes" className="flex-1 bg-gray-800 hover:bg-gray-700 text-lg py-2 rounded text-blue-400 transition-colors">
                                                <i className="ph-bold ph-eye"></i>
                                            </button>
                                            <button onClick={() => setEditIndex(realIndex)} title="Editar" className="flex-1 bg-blue-600/20 hover:bg-blue-600 text-lg py-2 rounded text-blue-400 hover:text-white border border-blue-500/30 transition-all">
                                                <i className="ph-bold ph-pencil-simple"></i>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            {/* Edit Sale Modal */}
            {editIndex !== null && (
                <EditSaleModal
                    saleIndex={editIndex}
                    onClose={() => setEditIndex(null)}
                />
            )}

            {/* Single Sale Detail Modal */}
            {detailSale && (
                <Modal active={!!detailSale} className="max-w-md p-6 border border-blue-500/30">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <i className="ph-fill ph-receipt text-green-500"></i> Detalhe da Venda
                        </h3>
                        <button onClick={() => setDetailSale(null)} className="text-gray-400 hover:text-white"><i className="ph-bold ph-x text-lg"></i></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-[10px] uppercase text-gray-500 font-bold">Cliente</p><p className="text-white font-bold text-lg">{detailSale.client} {detailSale.gender ? <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-800 text-gray-400 ml-2">{detailSale.gender}</span> : ''}</p></div>
                        <div className="text-right"><p className="text-[10px] uppercase text-gray-500 font-bold">Valor</p><p className="text-green-400 font-mono text-lg">{formatCurrency(detailSale.value)}</p></div>
                        <div><p className="text-[10px] uppercase text-blue-400 font-bold">E-mail</p><p className="text-gray-300 text-xs font-mono truncate" title={detailSale.email}>{detailSale.email || '-'}</p></div>
                        <div className="text-right"><p className="text-[10px] uppercase text-green-400 font-bold">Telefone</p><p className="text-gray-300 text-xs font-mono">{detailSale.phone || '-'}</p></div>
                        <div><p className="text-[10px] uppercase text-gray-500 font-bold">Tipo</p><p className="text-gray-300">{detailSale.type} {detailSale.procedureDetail ? <span className="text-blue-300">({detailSale.procedureDetail})</span> : ''}</p></div>
                        <div className="text-right"><p className="text-[10px] uppercase text-gray-500 font-bold">Vendedora</p><p className="text-pink-400 font-bold">{detailSale.seller}</p></div>
                        <div><p className="text-[10px] uppercase text-gray-500 font-bold">Data Lead</p><p className="text-gray-400">{formatDateBR(detailSale.leadDate)}</p></div>
                        <div className="text-right"><p className="text-[10px] uppercase text-gray-500 font-bold">Data Venda</p><p className="text-gray-400">{formatDateBR(detailSale.date)}</p></div>
                        <div className="col-span-2 bg-white/5 p-3 rounded-lg border border-white/10 mt-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] uppercase text-yellow-500 font-bold mb-1"><i className="ph-bold ph-timer"></i> Tempo de Conversão</p>
                                    <p className="text-white font-mono text-sm">{calculateLeadTime(detailSale.leadDate, detailSale.date)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase text-blue-400 font-bold mb-1"><i className="ph-bold ph-map-pin"></i> Local</p>
                                    <p className="text-white font-mono text-sm">{detailSale.location || '-'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] uppercase text-gray-500 font-bold">Status</p>
                            <p className={`font-bold text-sm ${detailSale.status === 'Cancelado' ? 'text-red-500' : 'text-green-400'}`}>{detailSale.status || 'Realizado'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] uppercase text-gray-500 font-bold">Origem / Tag</p>
                            <div className="flex flex-col gap-1 mt-1">
                                <span className="text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded w-fit">{detailSale.source}</span>
                                <span className="text-xs text-gray-500 font-mono break-all">{detailSale.tag}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button onClick={() => setDetailSale(null)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-xs">Fechar</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
