import React, { useState } from 'react';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import FilterPortal from './FilterPortal';
import MultiSelectFilterPlaceholder from './MultiSelectFilterPlaceholder';

const FiltersSection = ({ filters, setFilters, options, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Estado para controlar qual modal de filtro está aberto
  const [activeFilter, setActiveFilter] = useState(null);

  const hasActiveFilters = 
    filters.gerencia_da_via.length > 0 || 
    filters.atividade.length > 0 || 
    filters.status.length > 0 || 
    !!filters.data;

  const handleMultiSelectChange = (key, selectedOptions) => {
    setFilters(prev => ({ ...prev, [key]: selectedOptions }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300">
      {/* Cabeçalho do Filtro */}
      <div 
        className="px-6 py-4 flex justify-between items-center cursor-pointer border-b border-gray-100 hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-gray-700 font-bold">
          <Filter size={18} className="text-blue-900" />
          <span>Filtros</span>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full ml-2">
              Ativos
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button 
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-red-50"
            >
              <X size={12} /> Limpar
            </button>
          )}
          {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </div>

      {/* Corpo do Filtro */}
      {isExpanded && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50/50">
          
          {/* Filtro: Gerência */}
          <div className="relative">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Gerência</label>
            <div onClick={() => setActiveFilter('gerencia')}>
                <MultiSelectFilterPlaceholder 
                    label="Selecione..." 
                    count={filters.gerencia_da_via.length} 
                />
            </div>
            {activeFilter === 'gerencia' && (
                <FilterPortal 
                    title="Filtrar por Gerência" 
                    options={options.gerencia_da_via} 
                    selected={filters.gerencia_da_via} 
                    onChange={(vals) => handleMultiSelectChange('gerencia_da_via', vals)}
                    onClose={() => setActiveFilter(null)}
                />
            )}
          </div>

          {/* Filtro: Atividade */}
          <div className="relative">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Atividade</label>
            <div onClick={() => setActiveFilter('atividade')}>
                <MultiSelectFilterPlaceholder 
                    label="Todas as atividades" 
                    count={filters.atividade.length} 
                />
            </div>
             {activeFilter === 'atividade' && (
                <FilterPortal 
                    title="Filtrar por Atividade" 
                    options={options.atividade} 
                    selected={filters.atividade} 
                    onChange={(vals) => handleMultiSelectChange('atividade', vals)}
                    onClose={() => setActiveFilter(null)}
                />
            )}
          </div>

          {/* Filtro: Status */}
          <div className="relative">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
             <div onClick={() => setActiveFilter('status')}>
                <MultiSelectFilterPlaceholder 
                    label="Todos" 
                    count={filters.status.length} 
                />
            </div>
            {activeFilter === 'status' && (
                <FilterPortal 
                    title="Filtrar por Status" 
                    options={options.status} 
                    selected={filters.status} 
                    onChange={(vals) => handleMultiSelectChange('status', vals)}
                    onClose={() => setActiveFilter(null)}
                />
            )}
          </div>

          {/* Filtro: Data */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Data Específica</label>
            <input 
              type="date" 
              className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={filters.data}
              onChange={(e) => setFilters(prev => ({ ...prev, data: e.target.value }))}
            />
          </div>

        </div>
      )}
    </div>
  );
};

export default FiltersSection;