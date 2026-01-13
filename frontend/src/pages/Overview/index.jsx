import React, { useState } from 'react';
import { Loader2, AlertCircle, LayoutDashboard, Grid, CalendarDays, CalendarClock, Calendar } from 'lucide-react';
import { useOverview } from '../../hooks/useOverview';
import OverviewCard from '../../components/Overview/OverviewCard';
import GlobalKPIs from '../../components/Overview/GlobalKPIs';
import AnalyticsView from '../../components/Overview/AnalyticsView';

import { MAINTENANCE_CONFIG } from '../../config/maintenanceConfig';
import MaintenanceScreen from '../../components/Common/MaintenanceScreen';

const OverviewPage = () => {
  if (MAINTENANCE_CONFIG.overview) {
    return <MaintenanceScreen moduleName="Gerencial" />;
  }

  const [viewMode, setViewMode] = useState('semana');
  const [activeTab, setActiveTab] = useState('analytics'); // analytics | cards
  const { data: apiData, loading, error, refetch } = useOverview(viewMode);

  const TimeFilterButton = ({ label, value, icon: Icon }) => (
    <button
      onClick={() => setViewMode(value)}
      className={`
        flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all
        ${viewMode === value 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none' 
          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}
      `}
    >
      <Icon size={14} />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col w-full h-full min-h-[calc(100vh-100px)] bg-slate-50 dark:bg-slate-900/50 p-6">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Painel Gerencial</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Acompanhamento consolidado de performance</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'analytics' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <LayoutDashboard size={16} /> Visão Analítica
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'cards' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Grid size={16} /> Detalhes por Via
            </button>
          </div>

          <div className="flex gap-2">
            <TimeFilterButton label="Hoje" value="hoje" icon={CalendarClock} />
            <TimeFilterButton label="Semana" value="semana" icon={CalendarDays} />
            <TimeFilterButton label="Mês" value="mes" icon={Calendar} />
          </div>
        </div>
      </div>

      <div className="flex-grow">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mb-4" size={48} />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Processando Dados...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500 dark:text-red-400 bg-white dark:bg-slate-800 rounded-2xl border border-red-100 dark:border-red-900 shadow-sm p-8 max-w-lg mx-auto mt-10">
            <AlertCircle size={48} className="mb-3 opacity-50" />
            <p className="font-bold text-sm">Não foi possível carregar o dashboard</p>
            <button onClick={refetch} className="mt-6 px-6 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold transition-colors">
              Recarregar Página
            </button>
          </div>
        ) : apiData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-gray-400 dark:text-gray-500">
            <CalendarClock size={64} className="mb-4 opacity-20" />
            <p>Nenhum dado registrado para o período de <strong>{viewMode}</strong>.</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* KPI Section - Always Visible */}
            <GlobalKPIs data={apiData} />

            {/* Dynamic Content */}
            {activeTab === 'analytics' ? (
              // AQUI ESTÁ A MUDANÇA: Passamos viewMode para o componente
              <AnalyticsView data={apiData} viewMode={viewMode} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
                {apiData.map((gerencia) => (
                  <OverviewCard key={gerencia.id} gerencia={gerencia} viewMode={viewMode} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewPage;