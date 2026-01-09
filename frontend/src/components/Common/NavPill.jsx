import React from 'react';

const NavPill = ({ active, onClick, icon, label }) => {
  return (
    <button 
      onClick={onClick} 
      className={`
        flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out 
        ${active 
          ? 'bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-200 shadow-sm ring-1 ring-gray-200 dark:ring-slate-500' 
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-slate-700'
        }
      `}
    >
      {icon} {label}
    </button>
  );
};

export default NavPill;