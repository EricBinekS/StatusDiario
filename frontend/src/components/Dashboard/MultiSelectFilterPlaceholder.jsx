import React from 'react';
import { ChevronDown } from 'lucide-react';

const MultiSelectFilterPlaceholder = ({ label, count, active }) => {
  return (
    <div 
      className={`
        w-full h-8 flex items-center justify-between px-2 rounded-lg border text-xs cursor-pointer transition-all select-none
        ${active 
          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300' 
          : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-slate-500 hover:bg-blue-50 dark:hover:bg-slate-600'
        }
      `}
    >
      <span className="truncate font-medium mr-1">
        {count > 0 ? `${count} sel.` : 'Todos'}
      </span>
      <ChevronDown size={12} className={`opacity-50 transition-transform ${active ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
    </div>
  );
};

export default MultiSelectFilterPlaceholder;