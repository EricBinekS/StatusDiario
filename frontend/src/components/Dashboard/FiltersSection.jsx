import React from 'react';
import { X, Filter } from 'lucide-react';
import MultiSelectFilterPlaceholder from './MultiSelectFilterPlaceholder';
import FilterPortal from './FilterPortal';

const FiltersSection = ({ filters, setFilters, options, onClear }) => {
  const [activeFilter, setActiveFilter] = React.useState(null);

  const handleChange = (key, vals) => setFilters(prev => ({ ...prev, [key]: vals }));

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
      <div className="flex items-center gap-2 text-slate-700 text-sm font-bold min-w-max">
        <Filter size={16} />
        Filtros:
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 w-full">
        {/* Gerência */}
        <div className="relative">
          <div onClick={() => setActiveFilter('gerencia')}>
            <MultiSelectFilterPlaceholder label="Gerência" count={filters.gerencia_da_via.length} />
          </div>
          {activeFilter === 'gerencia' && (
            <FilterPortal 
              title="Gerência" 
              options={options.gerencia_da_via} 
              selected={filters.gerencia_da_via} 
              onChange={v => handleChange('gerencia_da_via', v)} 
              onClose={() => setActiveFilter(null)} 
            />
          )}
        </div>

        {/* Atividade */}
        <div className="relative">
           <div onClick={() => setActiveFilter('atividade')}>
            <MultiSelectFilterPlaceholder label="Atividade" count={filters.atividade.length} />
          </div>
          {activeFilter === 'atividade' && (
            <FilterPortal 
              title="Atividade" 
              options={options.atividade} 
              selected={filters.atividade} 
              onChange={v => handleChange('atividade', v)} 
              onClose={() => setActiveFilter(null)} 
            />
          )}
        </div>

        {/* Status */}
        <div className="relative">
           <div onClick={() => setActiveFilter('status')}>
            <MultiSelectFilterPlaceholder label="Status" count={filters.status.length} />
          </div>
          {activeFilter === 'status' && (
            <FilterPortal 
              title="Status" 
              options={options.status} 
              selected={filters.status} 
              onChange={v => handleChange('status', v)} 
              onClose={() => setActiveFilter(null)} 
            />
          )}
        </div>

         {/* Botão Limpar */}
        {(filters.gerencia_da_via.length > 0 || filters.atividade.length > 0 || filters.status.length > 0) && (
            <button 
                onClick={onClear}
                className="flex items-center justify-center gap-1 text-xs text-red-600 font-bold hover:bg-red-50 px-3 py-2 rounded transition-colors border border-transparent hover:border-red-100"
            >
                <X size={14} /> Limpar
            </button>
        )}
      </div>
    </div>
  );
};

export default FiltersSection;