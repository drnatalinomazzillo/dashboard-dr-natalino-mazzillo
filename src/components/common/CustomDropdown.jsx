import { useState, useRef, useEffect } from 'react';

export default function CustomDropdown({ items, value, onChange, placeholder = 'Buscar...', className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || '');
    const containerRef = useRef(null);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const filtered = items.filter(i =>
        i.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative custom-dropdown-container" ref={containerRef}>
            <input
                type="text"
                value={searchTerm}
                placeholder={placeholder}
                className={`input-field w-full rounded-lg p-3 text-xs font-mono uppercase text-blue-300 cursor-text ${className}`}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpen(true);
                }}
                autoComplete="off"
            />
            <div className={`custom-dropdown custom-scrollbar ${isOpen ? 'show' : ''}`}>
                {filtered.length === 0 ? (
                    <div className="p-3 text-gray-500 text-xs">Nenhum resultado.</div>
                ) : (
                    filtered.map((item, idx) => (
                        <div
                            key={idx}
                            className="dropdown-option"
                            onClick={() => {
                                setSearchTerm(item);
                                onChange(item);
                                setIsOpen(false);
                            }}
                        >
                            <strong>{item}</strong>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
