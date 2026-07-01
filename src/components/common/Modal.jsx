export default function Modal({ active, onClose, children, className = '' }) {
    return (
        <div className={`modal fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 ${active ? 'active' : ''}`}>
            <div className={`glass-panel w-full rounded-2xl relative flex flex-col ${className}`}>
                {children}
            </div>
        </div>
    );
}
