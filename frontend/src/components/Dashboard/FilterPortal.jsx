import React, { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';

const FilterPortal = ({ title, options = [], selected = [], onChange, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOptions = useMemo(() => 
    options?.filter(opt => String(opt).toLowerCase().includes(searchTerm.toLowerCase())) || [], 
  [options, searchTerm]);

  const isAllSelected = filteredOptions.length > 0 && filteredOptions.every(opt => selected.includes(opt));

  const toggleOption = (opt) => {
    if (selected.includes(opt)) onChange(selected.filter(s => s !== opt));
    else onChange([...selected, opt]);
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      onChange(selected.filter(s => !filteredOptions.includes(s)));
    } else {
      const newSelected = [...new Set([...selected, ...filteredOptions])];
      onChange(newSelected);
    }
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
      <div className="bg-gray-50/80 dark:bg-slate-900/50 px-3 py-2 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center backdrop-blur-sm">
        <h4 className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Filtrar {title}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700"><X size={14} /></button>
      </div>
      
      <div className="p-2 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="relative group">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input type="text" placeholder="Buscar..." className="w-full pl-8 pr-2 py-1.5 text-xs bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
        </div>
      </div>

      {/* AQUI ESTÃO AS MUDANÇAS DO SCROLLBAR */}
      <div className="max-h-56 overflow-y-auto p-1 bg-white dark:bg-slate-800 
        [&::-webkit-scrollbar]:w-1.5 
        [&::-webkit-scrollbar-track]:bg-transparent 
        [&::-webkit-scrollbar-thumb]:bg-gray-200 
        dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 
        [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-500"
      >
        {filteredOptions.length > 0 ? (
          filteredOptions.map(opt => (
            <div key={opt} onClick={() => toggleOption(opt)} className={`flex items-center px-2 py-2 text-xs rounded-md cursor-pointer select-none transition-all duration-150 ${selected.includes(opt) ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'}`}>
              <div className={`w-4 h-4 rounded border mr-2 flex-shrink-0 flex items-center justify-center transition-all ${selected.includes(opt) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700'}`}>
                {selected.includes(opt) && <Check size={10} className="text-white stroke-[3px]" />}
              </div>
              <span className="truncate leading-tight">{opt}</span>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400 gap-2"><Search size={16} className="opacity-20" /><span className="text-[10px]">Sem resultados</span></div>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-slate-900/50 p-2 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center gap-2">
        <div className="flex gap-1">
            <button 
                onClick={handleSelectAll} 
                disabled={filteredOptions.length === 0}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
                {isAllSelected ? 'Desmarcar' : 'Todos'}
            </button>
            
            <button 
                onClick={() => onChange([])} 
                disabled={selected.length === 0} 
                className="text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
            >
                Limpar
            </button>
        </div>
        <button onClick={onClose} className="text-[10px] font-bold bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 shadow-sm hover:shadow active:scale-95 transition-all">Aplicar</button>
      </div>
    </div>
  );
};
export default FilterPortal;