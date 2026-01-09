import React from 'react';
import { CalendarDays, CalendarRange, RefreshCw } from 'lucide-react';

const OverviewHeader = ({ viewMode, setViewMode, onRefresh, loading }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 px-1">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Visão Gerencial</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Acompanhamento consolidado</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Botão Refresh */}
        <button 
          onClick={onRefresh}
          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
          title="Atualizar dados"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>

        {/* Seletor de Período */}
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
          <button
            onClick={() => setViewMode('semana')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'semana' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <CalendarDays size={14} /> Semana
          </button>
          <button
            onClick={() => setViewMode('mes')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'mes' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <CalendarRange size={14} /> Mês
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewHeader;