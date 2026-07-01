import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { editSale as apiEditSale } from '../../services/apiService';
import { normalizeDate } from '../../utils/formatters';
import Modal from '../common/Modal';

export default function EditSaleModal({ saleIndex, onClose }) {
    const { state, dispatch, showToast } = useApp();
    const { sales, procedures } = state;
    const s = sales[saleIndex];

    const [date, setDate] = useState('');
    const [leadDate, setLeadDate] = useState('');
    const [consultationDate, setConsultationDate] = useState('');
    const [client, setClient] = useState('');
    const [source, setSource] = useState('Tráfego Pago');
    const [tag, setTag] = useState('');
    const [type, setType] = useState('Consulta');
    const [procedureDetail, setProcedureDetail] = useState('');
    const [location, setLocation] = useState('Cabo Frio');
    const [status, setStatus] = useState('Realizado');
    const [seller, setSeller] = useState('Amanda');
    const [value, setValue] = useState('');
    const [gender, setGender] = useState('Mulher');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!s) return;
        setDate(normalizeDate(s.date));
        setLeadDate(normalizeDate(s.leadDate));
        setConsultationDate(normalizeDate(s.consultationDate));
        setClient(s.client || '');
        setSource(s.source || 'Tráfego Pago');
        setTag(s.tag || '');
        setType(s.type || 'Consulta');
        setProcedureDetail(s.procedureDetail || '');
        setLocation(s.location || 'Cabo Frio');
        setSeller(s.seller || 'Amanda');
        setValue(s.value);
        setGender(s.gender || 'Mulher');
        if (s.status === 'Cancelado / Não Compareceu' || s.status === 'Cancelado') {
            setStatus('Cancelado');
        } else {
            setStatus(s.status || 'Realizado');
        }
    }, [s]);

    if (!s) return null;

    async function handleSave() {
        const val = parseFloat(value);
        if (!date || isNaN(val)) return showToast("Data e Valor são obrigatórios.", "error");

        const updatedData = {
            originalRowData: s,
            rowIndex: saleIndex,
            date, leadDate, client,
            value: val, seller, status, source, tag, type,
            procedureDetail, consultationDate, location, gender
        };

        setSaving(true);
        try {
            const result = await apiEditSale(updatedData);
            if (result.status === 'success') {
                dispatch({
                    type: 'UPDATE_SALE',
                    payload: {
                        index: saleIndex,
                        data: {
                            date, leadDate, client,
                            value: val, seller,
                            status: status === 'Cancelado' ? 'Cancelado / Não Compareceu' : status,
                            source, tag, type,
                            procedureDetail, consultationDate, location, gender
                        }
                    }
                });
                showToast("Venda atualizada!");
                onClose();
            } else {
                showToast("Erro: " + (result.message || "Desconhecido"), "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Erro ao editar", "error");
        }
        setSaving(false);
    }

    return (
        <Modal active={true} className="max-w-md p-6 border border-blue-500/30">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <i className="ph-fill ph-pencil-simple text-blue-500"></i> Editar Venda
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><i className="ph-bold ph-x text-lg"></i></button>
            </div>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-yellow-500 uppercase mb-1 block">Data Lead</label>
                        <input type="date" value={leadDate} onChange={e => setLeadDate(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm text-gray-300 cursor-pointer" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Data Venda</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm text-gray-300 cursor-pointer" />
                    </div>
                </div>

                {(type === 'Procedimento' || type === 'Consulta') && (
                    <div>
                        <label className="text-[10px] font-bold text-teal-400 uppercase mb-1 block">Data da Consulta</label>
                        <input type="date" value={consultationDate} onChange={e => setConsultationDate(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm text-gray-300 cursor-pointer" />
                    </div>
                )}

                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nome do Cliente</label>
                    <input type="text" value={client} onChange={e => setClient(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Origem</label>
                        <select value={source} onChange={e => setSource(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm cursor-pointer">
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
                    {source === 'Tráfego Pago' && (
                        <div>
                            <label className="text-[10px] font-bold text-blue-400 uppercase mb-1 block">TAG (Opcional)</label>
                            <input type="text" value={tag} onChange={e => setTag(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm font-mono uppercase" placeholder="(Ref: ABC)" />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-purple-400 uppercase mb-1 block">O que foi vendido?</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm cursor-pointer">
                            <option value="Consulta">Consulta</option>
                            <option value="Procedimento">Procedimento / Cirurgia</option>
                        </select>
                    </div>
                    {type === 'Procedimento' && (
                        <div>
                            <label className="text-[10px] font-bold text-purple-300 uppercase mb-1 block">Qual Procedimento?</label>
                            <select value={procedureDetail} onChange={e => setProcedureDetail(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm cursor-pointer border-l-4 border-l-purple-500">
                                <option value="">Selecione...</option>
                                {procedures.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-blue-300 uppercase mb-1 block">Local</label>
                        <select value={location} onChange={e => setLocation(e.target.value)} className="input-field w-full rounded-lg p-2.5 text-xs cursor-pointer">
                            <option value="Cabo Frio">Cabo Frio</option>
                            <option value="Barra da Tijuca">Barra da Tijuca</option>
                            <option value="Online">Online</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-pink-300 uppercase mb-1 block">Gênero</label>
                        <select value={gender} onChange={e => setGender(e.target.value)} className="input-field w-full rounded-lg p-2.5 text-xs cursor-pointer">
                            <option value="Mulher">Mulher</option>
                            <option value="Homem">Homem</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-yellow-300 uppercase mb-1 block">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="input-field w-full rounded-lg p-2.5 text-xs cursor-pointer">
                            <option value="Agendado">Agendado</option>
                            <option value="Realizado">Realizado</option>
                            <option value="Cancelado">Cancelado / Não Compareceu</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-[10px] font-bold text-pink-400 uppercase mb-1 block">Vendedora</label>
                        <select value={seller} onChange={e => setSeller(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm cursor-pointer">
                            <option value="Amanda">Amanda</option>
                            <option value="Daniele">Daniele</option>
                            <option value="Margo">Margo</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-green-400 uppercase mb-1 block">Valor Total</label>
                        <input type="number" value={value} onChange={e => setValue(e.target.value)} className="input-field w-full rounded-lg p-3 text-sm text-white font-bold" step="0.01" />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold text-sm transition-all shadow-lg shadow-blue-900/20 mt-4 flex justify-center items-center gap-2 cursor-pointer ${saving ? 'btn-loading' : ''}`}
                >
                    <i className="ph-bold ph-floppy-disk"></i> {saving ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}
                </button>
            </form>
        </Modal>
    );
}
