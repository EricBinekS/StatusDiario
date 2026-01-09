import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useOverview } from '../../hooks/useOverview';
import OverviewCard from '../../components/Overview/OverviewCard';
import OverviewHeader from '../../components/Overview/OverviewHeader';

// 1. IMPORTAR CONFIG E TELA COMUM
import { MAINTENANCE_CONFIG } from '../../config/maintenanceConfig';
import MaintenanceScreen from '../../components/Common/MaintenanceScreen';

const OverviewPage = () => {
  // 2. USAR A CONFIGURAÇÃO CENTRAL
  if (MAINTENANCE_CONFIG.overview) {
    return <MaintenanceScreen moduleName="Gerencial" />;
  }

  const [viewMode, setViewMode] = useState('semana');
  const { data: apiData, loading, error, refetch } = useOverview(viewMode);

  return (
    <div className="flex flex-col w-full h-full min-h-[calc(100vh-100px)]">
      <OverviewHeader 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        onRefresh={refetch} 
        loading={loading} 
      />

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
              <OverviewCard key={gerencia.id} gerencia={gerencia} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewPage;