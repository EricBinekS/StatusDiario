import React, { useState } from 'react';
import OverviewCard from '../../components/Overview/OverviewCard';
import { useOverview } from '../../hooks/useOverview'; // <--- Hook Real
import { CalendarDays, CalendarRange, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const OverviewPage = () => {
  const [viewMode, setViewMode] = useState('semana');
  
  // Conecta aos dados reais
  const { data: apiData, loading, error, refetch } = useOverview(viewMode);

  return (
    <div className="flex flex-col w-full h-full min-h-[calc(100vh-100px)]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Visão Gerencial</h2>
          <p className="text-xs text-slate-500">Acompanhamento consolidado</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Botão de Refresh Manual */}
          <button 
            onClick={refetch}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all"
            title="Atualizar dados"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Seletor de Período */}
          <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setViewMode('semana')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                viewMode === 'semana' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarDays size={14} /> Semana
            </button>
            <button
              onClick={() => setViewMode('mes')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                viewMode === 'mes' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarRange size={14} /> Mês
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal com Estados de Loading/Erro */}
      <div className="flex-grow">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-60">
            <Loader2 className="animate-spin text-blue-600 mb-3" size={48} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calculando Indicadores...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500 bg-white rounded-2xl border border-red-100 shadow-sm p-8">
            <AlertCircle size={48} className="mb-3 opacity-50" />
            <p className="font-bold text-sm">Falha ao carregar indicadores</p>
            <button onClick={refetch} className="mt-4 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-colors">
              Tentar Novamente
            </button>
          </div>
        ) : apiData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
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