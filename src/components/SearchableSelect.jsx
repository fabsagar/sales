import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    className = '',
    emptyMessage = 'No results found'
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value?.toString() === value?.toString());

    const filteredOptions = options.filter(opt =>
        (opt.label || '').toLowerCase().includes(search.toLowerCase()) ||
        (opt.sublabel || '').toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearch('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className} ${isOpen ? 'z-[100]' : 'z-0'}`} ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-surface-900/50 border border-surface-700/50 rounded-xl px-4 py-2.5 text-sm text-white cursor-pointer hover:bg-surface-800 hover:border-primary-500/30 transition-all duration-300 shadow-lg group"
            >
                <div className="flex-1 truncate mr-2">
                    {selectedOption ? (
                        <div className="flex flex-col">
                            <span className="font-bold text-white leading-tight">{selectedOption.label}</span>
                            {selectedOption.sublabel && (
                                <span className="text-[10px] text-slate-500 font-medium">{selectedOption.sublabel}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-slate-500 italic">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    {value && (
                        <button
                            onClick={handleClear}
                            className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full bg-surface-800/95 backdrop-blur-xl border border-surface-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 origin-top">
                    <div className="p-3 border-b border-surface-700/30 flex items-center gap-3 bg-black/20">
                        <Search size={16} className="text-primary-500 shrink-0" />
                        <input
                            type="text"
                            autoFocus
                            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-600 font-medium"
                            placeholder="Type to search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-72 overflow-y-auto py-2 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    className={`w-full text-left px-4 py-3 cursor-pointer transition-all flex items-center justify-between group
                                        ${opt.value?.toString() === value?.toString()
                                            ? 'bg-primary-600/30 text-primary-300'
                                            : 'hover:bg-primary-600/10 text-slate-300 hover:text-white'
                                        }
                                    `}
                                >
                                    <div className="flex flex-col flex-1 truncate">
                                        <span className={`font-bold ${opt.value?.toString() === value?.toString() ? 'text-primary-400' : ''}`}>
                                            {opt.label}
                                        </span>
                                        {opt.sublabel && (
                                            <span className="text-[10px] text-slate-500 group-hover:text-slate-400 truncate">
                                                {opt.sublabel}
                                            </span>
                                        )}
                                    </div>
                                    {opt.value?.toString() === value?.toString() && (
                                        <div className="bg-primary-500/20 p-1 rounded-full text-primary-500">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-10 text-center flex flex-col items-center gap-2">
                                <Search size={24} className="text-slate-700 opacity-20" />
                                <span className="text-xs text-slate-500 font-medium italic">
                                    {emptyMessage}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
