import React from 'react';
import { ChevronDown } from 'lucide-react';

const MultiSelectFilterPlaceholder = ({ label, count }) => {
  return (
    <div className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors group">
      <span className={`text-sm truncate ${count > 0 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
        {count > 0 ? `${count} selecionado(s)` : label}
      </span>
      <ChevronDown size={16} className="text-gray-400 group-hover:text-blue-500" />
    </div>
  );
};

export default MultiSelectFilterPlaceholder;