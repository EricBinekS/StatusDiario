import React, { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';

const FilterPortal = ({ title, options = [], selected = [], onChange, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredOptions = useMemo(() => options?.filter(opt => String(opt).toLowerCase().includes(searchTerm.toLowerCase())) || [], [options, searchTerm]);

  const toggleOption = (opt) => {
    if (selected.includes(opt)) onChange(selected.filter(s => s !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <div className="w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
      <div className="bg-gray-50/80 px-3 py-2 border-b border-gray-100 flex justify-between items-center backdrop-blur-sm">
        <h4 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Filtrar {title}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-gray-200"><X size={14} /></button>
      </div>
      <div className="p-2 border-b border-gray-100 bg-white">
        <div className="relative group">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input type="text" placeholder="Buscar..." className="w-full pl-8 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
        </div>
      </div>
      <div className="max-h-56 overflow-y-auto p-1 bg-white scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {filteredOptions.length > 0 ? (
          filteredOptions.map(opt => (
            <div key={opt} onClick={() => toggleOption(opt)} className={`flex items-center px-2 py-2 text-xs rounded-md cursor-pointer select-none transition-all duration-150 ${selected.includes(opt) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <div className={`w-4 h-4 rounded border mr-2 flex-shrink-0 flex items-center justify-center transition-all ${selected.includes(opt) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                {selected.includes(opt) && <Check size={10} className="text-white stroke-[3px]" />}
              </div>
              <span className="truncate leading-tight">{opt}</span>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400 gap-2"><Search size={16} className="opacity-20" /><span className="text-[10px]">Sem resultados</span></div>
        )}
      </div>
      <div className="bg-gray-50 p-2 border-t border-gray-100 flex justify-between items-center">
        <button onClick={() => onChange([])} disabled={selected.length === 0} className="text-[10px] font-bold text-gray-500 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors">Limpar ({selected.length})</button>
        <button onClick={onClose} className="text-[10px] font-bold bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 shadow-sm hover:shadow active:scale-95 transition-all">Aplicar</button>
      </div>
    </div>
  );
};
export default FilterPortal;