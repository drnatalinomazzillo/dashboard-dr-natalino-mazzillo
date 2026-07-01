import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { addCreatives } from '../../services/apiService';
import { generateCreativeIdeas } from '../../services/geminiService';
import { formatDateBR } from '../../utils/formatters';
import { marked } from 'marked';

export default function GeneratorTab() {
    const { state, dispatch, showToast, initData } = useApp();
    const { publics, procedures, history } = state;

    const [campanhaNome, setCampanhaNome] = useState('');
    const [conjuntoNome, setConjuntoNome] = useState('');
    const [publicoSelect, setPublicoSelect] = useState('');
    const [procedimentoSelect, setProcedimentoSelect] = useState('');
    const [creativeRows, setCreativeRows] = useState([{ num: '', name: '' }]);
    const [searchInput, setSearchInput] = useState('');
    const [libraryFilterPublic, setLibraryFilterPublic] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState('');
    const [showAI, setShowAI] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [saving, setSaving] = useState(false);

    function addRow() {
        setCreativeRows([...creativeRows, { num: '', name: '' }]);
    }

    function removeRow(idx) {
        setCreativeRows(creativeRows.filter((_, i) => i !== idx));
    }

    function updateRow(idx, field, value) {
        const updated = [...creativeRows];
        updated[idx][field] = value;
        setCreativeRows(updated);
    }

    async function handleGenerateIdeas() {
        if (!publicoSelect || !procedimentoSelect) return alert("Selecione um Público e um Procedimento primeiro.");
        const pubName = publics.find(p => p.code === publicoSelect)?.name || publicoSelect;
        const procName = procedures.find(p => p.code === procedimentoSelect)?.name || procedimentoSelect;

        setGeneratingAI(true);
        try {
            const result = await generateCreativeIdeas(pubName, procName);
            if (result) {
                setAiSuggestions(result);
                setShowAI(true);
            }
        } catch (e) {
            alert("Erro ao conectar com a IA: " + e.message);
        }
        setGeneratingAI(false);
    }

    async function handleGenerate() {
        if (!publicoSelect || !procedimentoSelect) return showToast("Selecione Público e Procedimento", "error");

        let newItems = [], duplicates = [];
        creativeRows.forEach(r => {
            const num = r.num.trim(), name = r.name.trim();
            if (num && name) {
                const refCode = `(Ref: ${publicoSelect}${procedimentoSelect} - ${num})`;
                const exists = history.some(h => h.refCode === refCode) || newItems.some(i => i.refCode === refCode);
                if (exists) duplicates.push(refCode);
                else newItems.push({
                    date: new Date().toLocaleDateString('pt-BR'),
                    campaign: campanhaNome,
                    adSet: conjuntoNome,
                    refCode,
                    finalName: `${refCode} -${name} `,
                    utmString: `utm_source = facebook & utm_medium=cpc & utm_campaign=${publicoSelect}${procedimentoSelect}& utm_content=${num} `
                });
            }
        });

        if (duplicates.length > 0) {
            alert("ATENÇÃO: CÓDIGOS DUPLICADOS ENCONTRADOS!\n\nEstes números já foram usados:\n" + duplicates.join('\n') + "\n\nPor favor, altere a numeração e tente novamente.");
            return;
        }

        if (newItems.length) {
            setSaving(true);
            try {
                await addCreatives(newItems);
                dispatch({ type: 'ADD_CREATIVES', payload: newItems });
                showToast("Gerado!");
                initData();
            } catch (e) {
                console.error(e);
                showToast("Erro nuvem", "error");
            }
            setSaving(false);
        }
    }

    function copyText(t) {
        navigator.clipboard.writeText(t).then(() => showToast("Copiado!"));
    }

    // Library filtering
    const sortedHistory = [...history].reverse();
    const searchTerms = searchInput.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    const filtered = sortedHistory.filter(i => {
        let matchesSearch = true;
        if (searchTerms.length > 0) {
            const fullText = ((i.finalName || '') + " " + (i.refCode || '') + " " + (i.campaign || '') + " " + (i.adSet || '')).toLowerCase();
            matchesSearch = searchTerms.every(t => fullText.includes(t));
        }
        let matchesPub = true;
        if (libraryFilterPublic) {
            const fullText = ((i.finalName || '') + " " + (i.campaign || '')).toLowerCase();
            matchesPub = fullText.includes(libraryFilterPublic.toLowerCase());
        }
        return matchesSearch && matchesPub;
    });

    return (
        <div className="w-full max-w-[1400px]">
            {/* BATCH FORM */}
            <section className="glass-panel rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <i className="ph-fill ph-sliders-horizontal text-blue-400"></i> Configuração em Lote
                    </h2>
                    <button
                        type="button"
                        onClick={handleGenerateIdeas}
                        disabled={generatingAI}
                        className="text-xs flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all cursor-pointer border border-white/10"
                    >
                        <i className={`ph-fill ${generatingAI ? 'ph-spinner animate-spin' : 'ph-sparkle'}`}></i>
                        {generatingAI ? 'Pensando...' : 'Ideias com IA'}
                    </button>
                </div>

                <form className="relative z-10" onSubmit={e => e.preventDefault()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-800/50">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nome da Campanha</label>
                            <input type="text" value={campanhaNome} onChange={e => setCampanhaNome(e.target.value)} placeholder="Ex: 1 - [LEADS RJ]..." className="input-field w-full rounded-lg p-3 text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nome do Conjunto</label>
                            <input type="text" value={conjuntoNome} onChange={e => setConjuntoNome(e.target.value)} placeholder="Ex: 01 - Lipo HD" className="input-field w-full rounded-lg p-3 text-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="text-[10px] font-bold text-blue-400 uppercase mb-1 block">1. Público e Local</label>
                            <select value={publicoSelect} onChange={e => setPublicoSelect(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm text-gray-200 focus:text-white cursor-pointer">
                                <option value="">Selecione...</option>
                                {publics.map(i => <option key={i.code} value={i.code}>{i.name} ({i.code})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-purple-400 uppercase mb-1 block">2. Procedimento</label>
                            <select value={procedimentoSelect} onChange={e => setProcedimentoSelect(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm text-gray-200 focus:text-white cursor-pointer">
                                <option value="">Selecione...</option>
                                {procedures.map(i => <option key={i.code} value={i.code}>{i.name} ({i.code})</option>)}
                            </select>
                        </div>
                    </div>

                    {/* AI Suggestions */}
                    {showAI && (
                        <div className="mb-6 ai-border bg-gray-900/80 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-xs font-bold text-purple-400 uppercase flex items-center gap-2">
                                    <i className="ph-fill ph-brain"></i> Sugestões da IA
                                </h4>
                                <button type="button" onClick={() => setShowAI(false)} className="text-gray-500 hover:text-white">
                                    <i className="ph-bold ph-x"></i>
                                </button>
                            </div>
                            <div className="prose text-gray-300 text-sm" dangerouslySetInnerHTML={{ __html: marked.parse(aiSuggestions) }} />
                        </div>
                    )}

                    {/* Creative Rows */}
                    <div className="bg-black/30 rounded-xl p-6 border border-gray-800/50 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">3. Lista de Criativos</label>
                            <button type="button" onClick={addRow} className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors font-bold uppercase cursor-pointer">
                                <i className="ph-bold ph-plus"></i> Adicionar Linha
                            </button>
                        </div>
                        <div className="space-y-3">
                            {creativeRows.map((row, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-3">
                                    <div className="col-span-3 md:col-span-2">
                                        <input type="text" placeholder="Nº (01)" value={row.num} onChange={e => updateRow(idx, 'num', e.target.value)} className="input-field w-full rounded-lg p-3 text-sm text-center font-mono border-l-4 border-l-blue-500" maxLength="3" />
                                    </div>
                                    <div className="col-span-8 md:col-span-9">
                                        <input type="text" placeholder="Nome do Criativo" value={row.name} onChange={e => updateRow(idx, 'name', e.target.value)} className="input-field w-full rounded-lg p-3 text-sm" />
                                    </div>
                                    <div className="col-span-1 flex items-center justify-center">
                                        {idx > 0 && (
                                            <button type="button" onClick={() => removeRow(idx)} className="text-gray-600 hover:text-red-500">
                                                <i className="ph-bold ph-x"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="button" onClick={handleGenerate} disabled={saving} className="btn-primary px-8 py-4 rounded-xl flex items-center gap-3 text-sm font-bold shadow-lg shadow-blue-900/20 cursor-pointer">
                            <i className="ph-bold ph-cloud-arrow-up text-lg"></i> {saving ? 'Salvando...' : 'GERAR E SALVAR'}
                        </button>
                    </div>
                </form>
            </section>

            {/* LIBRARY */}
            <section className="w-full">
                <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 px-1">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <i className="ph-fill ph-books text-purple-500"></i> Biblioteca (Nuvem)
                    </h2>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select value={libraryFilterPublic} onChange={e => setLibraryFilterPublic(e.target.value)} className="input-field rounded-lg px-2 py-2 text-xs w-32 md:w-40 cursor-pointer border-gray-700">
                            <option value="">Todos Públicos</option>
                            {publics.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                        </select>
                        <div className="relative flex-1 md:flex-none">
                            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
                            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Buscar (ex: remarketing mulher)..." className="input-field pl-8 pr-4 py-2 rounded-lg text-xs w-full md:w-64" />
                        </div>
                        <button onClick={() => initData()} className="bg-gray-800 hover:bg-white/10 text-white p-2 rounded-lg" title="Forçar Atualização">
                            <i className="ph-bold ph-arrows-clockwise"></i>
                        </button>
                    </div>
                </div>
                <div className="glass-panel rounded-xl overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-900/90 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                <tr>
                                    <th className="px-4 py-4 border-b border-gray-800">Campanha</th>
                                    <th className="px-4 py-4 border-b border-gray-800">Conjunto</th>
                                    <th className="px-4 py-4 border-b border-gray-800 min-w-[250px]">
                                        <div className="flex items-center gap-1"><i className="ph-fill ph-facebook-logo text-blue-500"></i> Criativo Facebook</div>
                                    </th>
                                    <th className="px-4 py-4 border-b border-gray-800">
                                        <div className="flex items-center gap-1"><i className="ph-bold ph-link text-blue-400"></i> UTM</div>
                                    </th>
                                    <th className="px-4 py-4 border-b border-gray-800">
                                        <div className="flex items-center gap-1"><i className="ph-fill ph-tag text-green-500"></i> Tag Kommo</div>
                                    </th>
                                    <th className="px-4 py-4 border-b border-gray-800 text-center">Ação</th>
                                    <th className="px-4 py-4 border-b border-gray-800 text-right">Data</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs divide-y divide-gray-800/50">
                                {filtered.map((i, idx) => (
                                    <tr key={idx} className="hover:bg-blue-900/10 border-b border-gray-800/50 group">
                                        <td className="px-4 py-3 truncate max-w-[150px] text-gray-400">{i.campaign || '-'}</td>
                                        <td className="px-4 py-3 truncate max-w-[150px] text-gray-400">{i.adSet || '-'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium truncate max-w-[200px]">{i.finalName}</span>
                                                <button onClick={() => copyText(i.finalName)} className="text-gray-600 hover:text-blue-400"><i className="ph-bold ph-copy"></i></button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => copyText(i.utmString)} className="text-[10px] bg-blue-900/20 text-blue-400 px-2 py-1 rounded">UTM</button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => copyText(i.refCode)} className="text-[10px] bg-green-900/20 text-green-400 px-2 py-1 rounded font-mono">{i.refCode}</button>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button className="text-gray-600 hover:text-red-500 p-1.5" disabled title="Exclua na planilha"><i className="ph-bold ph-trash"></i></button>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500 text-[10px]">{formatDateBR(i.date)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-600">
                                <i className="ph ph-ghost text-4xl mb-2 opacity-50"></i>
                                <p>Biblioteca vazia ou filtro sem resultados.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
