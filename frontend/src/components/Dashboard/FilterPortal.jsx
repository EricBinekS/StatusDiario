import React, { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';

// Um modal simples que aparece sobre o conteúdo
const FilterPortal = ({ title, options, selected, onChange, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => {
    return options.filter(opt => 
      String(opt).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const toggleOption = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="absolute top-full left-0 mt-2 w-full md:w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden animation-fade-in">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h4 className="text-sm font-bold text-gray-700">{title}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-100">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-blue-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* Options List */}
      <div className="max-h-48 overflow-y-auto p-2 space-y-1">
        {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
            <div 
                key={opt}
                onClick={() => toggleOption(opt)}
                className={`flex items-center px-3 py-2 text-xs rounded cursor-pointer transition-colors ${
                selected.includes(opt) 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
                <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${
                selected.includes(opt) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                }`}>
                {selected.includes(opt) && <Check size={10} className="text-white" />}
                </div>
                <span className="truncate">{opt}</span>
            </div>
            ))
        ) : (
            <p className="text-center text-xs text-gray-400 py-4">Nenhuma opção encontrada</p>
        )}
      </div>
      
      {/* Footer Actions (Opcional) */}
      <div className="bg-gray-50 p-2 border-t border-gray-100 flex justify-between">
          <button 
            onClick={() => onChange([])}
            className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
          >
            Limpar
          </button>
          <button 
            onClick={onClose}
            className="text-xs bg-blue-900 text-white px-3 py-1 rounded hover:bg-blue-800"
          >
            OK
          </button>
      </div>

      <div 
        className="fixed inset-0 z-[-1]" 
        onClick={onClose}
      />
    </div>
  );
};

export default FilterPortal;