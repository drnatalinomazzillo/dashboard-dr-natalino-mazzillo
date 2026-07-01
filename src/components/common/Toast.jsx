import { useApp } from '../../context/AppContext';

export default function Toast() {
    const { state } = useApp();
    const { toast } = state;

    const bgClass = toast.type === 'error'
        ? 'bg-red-600 border-red-500/50'
        : 'bg-green-600 border-green-500/50';

    return (
        <div
            className={`toast-container flex items-center justify-center gap-3 border text-white shadow-lg ${bgClass} ${toast.visible ? 'show' : ''}`}
        >
            <i className="ph-bold ph-check-circle text-2xl"></i>
            <span>{toast.message}</span>
        </div>
    );
}
