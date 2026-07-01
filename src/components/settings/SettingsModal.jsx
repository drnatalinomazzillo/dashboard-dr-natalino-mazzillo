import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { addConfig } from '../../services/apiService';
import Modal from '../common/Modal';

export default function SettingsModal({ onClose }) {
    const { state, dispatch, showToast, initData } = useApp();
    const { publics, procedures } = state;

    const [activeTab, setActiveTab] = useState('publics');
    const [newName, setNewName] = useState('');
    const [newCode, setNewCode] = useState('');
    const [saving, setSaving] = useState(false);

    async function handleAdd() {
        const name = newName.trim();
        const code = newCode.trim().toUpperCase();
        if (!name || !code) return showToast("Preencha nome e código", "error");

        const type = activeTab === 'publics' ? 'public' : 'procedure';

        setSaving(true);
        try {
            await addConfig({ type, name, code });
            dispatch({ type: 'ADD_CONFIG', payload: { type, name, code } });
            showToast(`${type === 'public' ? 'Público' : 'Procedimento'} adicionado!`);
            setNewName('');
            setNewCode('');
            initData();
        } catch (e) {
            console.error(e);
            showToast("Erro ao salvar", "error");
        }
        setSaving(false);
    }

    const items = activeTab === 'publics' ? publics : procedures;
    const colorClass = activeTab === 'publics' ? 'text-blue-400' : 'text-purple-400';

    return (
        <Modal active={true} className="max-w-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <i className="ph ph-gear text-blue-500"></i> Configurações
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
                    <i className="ph-bold ph-x text-lg"></i>
                </button>
            </div>

            {/* Tab Toggle */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('publics')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${activeTab === 'publics' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'} cursor-pointer`}
                >
                    <i className="ph-fill ph-users mr-1"></i> Públicos ({publics.length})
                </button>
                <button
                    onClick={() => setActiveTab('procedures')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${activeTab === 'procedures' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} cursor-pointer`}
                >
                    <i className="ph-fill ph-syringe mr-1"></i> Procedimentos ({procedures.length})
                </button>
            </div>

            {/* Current List */}
            <div className="mb-6 max-h-48 overflow-y-auto space-y-2">
                {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between bg-gray-800/40 p-3 rounded border border-gray-700">
                        <span className="text-gray-200 text-xs">{item.name}</span>
                        <span className={`${colorClass} font-mono text-[10px]`}>{item.code}</span>
                    </div>
                ))}
                {items.length === 0 && (
                    <p className="text-gray-600 text-xs text-center py-4">Nenhum item cadastrado.</p>
                )}
            </div>

            {/* Add New */}
            <div className="border-t border-gray-800 pt-4">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-3">Adicionar Novo</p>
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        placeholder="Nome (Ex: Lipo HD)"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="input-field flex-1 rounded-lg p-3 text-sm"
                    />
                    <input
                        type="text"
                        placeholder="Código (Ex: LPH)"
                        value={newCode}
                        onChange={e => setNewCode(e.target.value)}
                        className="input-field w-28 rounded-lg p-3 text-sm text-center font-mono uppercase"
                        maxLength="5"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={saving}
                    className={`w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold text-sm transition-all flex justify-center items-center gap-2 cursor-pointer ${saving ? 'btn-loading' : ''}`}
                >
                    <i className="ph-bold ph-plus"></i> {saving ? 'Salvando...' : 'ADICIONAR'}
                </button>
            </div>
        </Modal>
    );
}
