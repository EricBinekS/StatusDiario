import React from 'react';
import { ChevronDown, Filter } from 'lucide-react';

const MultiSelectFilterPlaceholder = ({ label, count, active }) => {
  return (
    <div className={`h-8 min-w-[130px] px-3 border rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 select-none bg-white ${active ? 'border-blue-500 ring-2 ring-blue-100 text-blue-700 shadow-sm' : 'border-gray-300 text-slate-600 hover:border-blue-400 hover:text-blue-600'}`}>
      <div className="flex items-center gap-2 overflow-hidden max-w-[140px]">
        {count > 0 ? (
          <div className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold">{count}</div>
        ) : (
          <Filter size={12} className="text-gray-400 flex-shrink-0" />
        )}
        <span className={`text-xs truncate ${count > 0 ? 'font-bold' : ''}`}>{count > 0 ? 'Selecionados' : 'Todos'}</span>
      </div>
      <ChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${active ? 'rotate-180 text-blue-500' : ''}`} />
    </div>
  );
};
export default MultiSelectFilterPlaceholder;