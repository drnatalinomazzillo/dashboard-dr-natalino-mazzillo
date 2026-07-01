export default function Loader({ visible }) {
    return (
        <div className={`loader-overlay ${visible ? '' : 'hidden'}`}>
            <div className="flex flex-col items-center gap-4">
                <div className="spinner"></div>
                <p className="text-blue-400 text-xs font-bold tracking-widest uppercase animate-pulse">
                    Sincronizando Nuvem...
                </p>
            </div>
        </div>
    );
}
