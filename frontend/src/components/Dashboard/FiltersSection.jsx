import React, { useState } from 'react';
// MUDANÇA: Importei o ícone 'Copy' em vez de 'Image'
import { X, Calendar, Copy, Loader2 } from 'lucide-react';
import FilterPortal from './FilterPortal';
import MultiSelectFilterPlaceholder from './MultiSelectFilterPlaceholder';

const FiltersSection = ({ filters, setFilters, options, onClear, onExport, isExporting }) => {
  const [activeFilter, setActiveFilter] = useState(null);
  const handleFilterChange = (key, newValues) => setFilters(prev => ({ ...prev, [key]: newValues }));
  const hasFilters = Object.keys(filters).some(k => k !== 'data' && filters[k]?.length > 0);

  const filterConfig = [
    { key: 'gerencia', label: 'Gerência' }, { key: 'trecho', label: 'Trecho' },
    { key: 'sub', label: 'Sub' }, { key: 'ativo', label: 'Ativo' },
    { key: 'atividade', label: 'Atividade' }, { key: 'tipo', label: 'Tipo' },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 flex items-center gap-4">
      <div className="flex-grow flex flex-col gap-2">
        {hasFilters && (
          <div className="flex justify-end mb-1">
            <button onClick={onClear} className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1">
              <X size={12} /> Limpar filtros selecionados
            </button>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 items-center">
          <div className="flex flex-col gap-1 relative group">
             <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide absolute -top-3 left-0 group-hover:text-blue-500 transition-colors">Data Base</label>
             <div className="relative">
                <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="date" value={filters.data} onChange={(e) => setFilters(prev => ({ ...prev, data: e.target.value }))} className="w-full h-8 pl-8 pr-2 text-xs border border-gray-300 rounded-lg bg-gray-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm font-medium" />
             </div>
          </div>
          {filterConfig.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1 relative group">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide absolute -top-3 left-0 group-hover:text-blue-500 transition-colors">{label}</label>
              <div onClick={() => setActiveFilter(activeFilter === key ? null : key)}>
                <MultiSelectFilterPlaceholder label={label} count={filters[key]?.length || 0} active={activeFilter === key} />
              </div>
              {activeFilter === key && (
                <div className="absolute top-full left-0 mt-1 z-[100] w-full min-w-[200px]">
                  <FilterPortal title={label} options={options[key] || []} selected={filters[key] || []} onChange={(vals) => handleFilterChange(key, vals)} onClose={() => setActiveFilter(null)} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Botão de Copiar Imagem */}
      <div className="flex items-center justify-center border-l border-gray-100 pl-4 min-w-[100px]">
        <button 
          onClick={onExport} 
          disabled={isExporting}
          className="flex items-center justify-center gap-2 px-3 py-1.5 h-8 text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 rounded-lg transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
             <><Loader2 size={14} className="animate-spin" /> Copiando...</>
          ) : (
             // Usando ícone COPY e texto atualizado
             <><Copy size={14} /> Imagem</>
          )}
        </button>
      </div>
    </div>
  );
};
export default FiltersSection;