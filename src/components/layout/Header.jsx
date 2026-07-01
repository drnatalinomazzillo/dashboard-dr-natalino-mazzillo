import { useApp } from '../../context/AppContext';

const tabs = [
    { id: 'vendas', icon: 'ph-receipt', label: 'Vendas' },
    { id: 'analytics', icon: 'ph-chart-line-up', label: 'Resultados' },
    { id: 'simulator', icon: 'ph-rocket-launch', label: 'Simulador' },
    { id: 'generator', icon: 'ph-code', label: 'Gerador' },
];

export default function Header({ onOpenSettings }) {
    const { state, dispatch } = useApp();

    return (
        <header className="w-full max-w-[1400px] mb-8 flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-6 gap-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <i className="ph-fill ph-brain text-purple-500 text-3xl"></i>
                    DASHBOARD PRÓXIMO NÍVEL®
                </h1>
                <p className="text-gray-500 text-xs uppercase tracking-widest mt-1 ml-11">
                    Marketing, Vendas e Resultados | Dr. Natalino Mazzillo
                </p>
            </div>
            <nav className="flex gap-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}
                        className={`nav-btn ${state.activeTab === tab.id ? 'active' : ''}`}
                    >
                        <i className={`ph-bold ${tab.icon}`}></i> {tab.label}
                    </button>
                ))}
            </nav>
            <button
                onClick={onOpenSettings}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 hover:border-blue-500 bg-gray-900/50 transition-all text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
                <i className="ph ph-gear"></i> Configurações
            </button>
        </header>
    );
}
