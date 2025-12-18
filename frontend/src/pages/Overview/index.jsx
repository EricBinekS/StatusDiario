import React, { useState } from 'react';
import OverviewCard from '../../components/Overview/OverviewCard';
import { useOverview } from '../../hooks/useOverview';
import { CalendarDays, CalendarRange, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const OverviewPage = () => {
  const [viewMode, setViewMode] = useState('semana');
  const { data: apiData, loading, error, refetch } = useOverview(viewMode);

  return (
    <div className="flex flex-col w-full h-full min-h-[calc(100vh-100px)]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 px-1">
        <div>
          {/* Título: dark:text-white */}
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Visão Gerencial</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Acompanhamento consolidado</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Botão de Refresh: dark:hover:text-blue-400 dark:hover:bg-slate-800 */}
          <button 
            onClick={refetch}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Atualizar dados"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Seletor de Período */}
          {/* Container: bg-white -> dark:bg-slate-800 | border-gray-200 -> dark:border-slate-700 */}
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <button
              onClick={() => setViewMode('semana')}
              // Botão Ativo: bg-blue-50 -> dark:bg-blue-900/30 | text-blue-700 -> dark:text-blue-300
              // Botão Inativo: text-gray-500 -> dark:text-gray-400
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

      {/* Conteúdo Principal */}
      <div className="flex-grow">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-60">
            <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mb-3" size={48} />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Calculando Indicadores...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500 dark:text-red-400 bg-white dark:bg-slate-800 rounded-2xl border border-red-100 dark:border-red-900 shadow-sm p-8">
            <AlertCircle size={48} className="mb-3 opacity-50" />
            <p className="font-bold text-sm">Falha ao carregar indicadores</p>
            <button onClick={refetch} className="mt-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold transition-colors">
              Tentar Novamente
            </button>
          </div>
        ) : apiData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
            <p>Nenhum dado encontrado para este período.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
            {apiData.map((gerencia) => (
              <OverviewCard 
                key={gerencia.id} 
                gerencia={gerencia} 
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewPage;