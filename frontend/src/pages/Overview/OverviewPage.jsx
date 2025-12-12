import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import OverviewHeader from '../../components/Header/AppHeader'; 
import AderenciaCard from '../../components/Overview/AderenciaCard';
import useFetchOverview from '../../hooks/useFetchOverview';

const OverviewPage = () => {
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get('view') === 'mes' ? 'mes' : 'semana';
  const [viewMode, setViewMode] = useState(initialView);
  
  // Sincroniza estado com URL
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'mes' || view === 'semana') {
      setViewMode(view);
    }
  }, [searchParams]);

  const { overviewData, loading, error, refetch } = useFetchOverview(viewMode);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const handleRefresh = () => {
    refetch();
    setLastUpdate(new Date());
  };

  // --- BLINDAGEM CONTRA CRASH (t.map is not a function) ---
  // Se overviewData não for um Array, forçamos uma lista vazia para não quebrar a tela
  const safeData = Array.isArray(overviewData) ? overviewData : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  // Se houver erro ou dados vazios/inválidos
  if (error || safeData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <OverviewHeader 
          lastUpdate={lastUpdate} 
          onRefresh={handleRefresh}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-lg shadow-sm border">
            <p className="text-red-500 mb-2 font-semibold">Não foi possível carregar os dados.</p>
            <p className="text-gray-500 text-sm mb-4">Verifique se o backend está online ou tente novamente.</p>
            <button onClick={handleRefresh} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Tentar Novamente
            </button>
            {/* Debug Opcional: Mostra o que chegou do backend se não for array */}
            {!Array.isArray(overviewData) && (
               <pre className="mt-4 text-xs text-left bg-gray-100 p-2 overflow-auto max-w-md">
                 Debug: {JSON.stringify(overviewData, null, 2)}
               </pre>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <OverviewHeader 
        lastUpdate={lastUpdate} 
        onRefresh={handleRefresh}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <main className="flex-grow p-4 md:p-6 overflow-auto">
        <div className="max-w-[1920px] mx-auto space-y-8">
          
          {/* Loop Seguro usando safeData */}
          {safeData.map((gerencia) => (
            <OverviewSection key={gerencia.id} gerencia={gerencia} />
          ))}

        </div>
      </main>
    </div>
  );
};

// Subcomponente para organizar a seção de cada gerência
const OverviewSection = ({ gerencia }) => {
  const [selectedType, setSelectedType] = useState('contrato'); // 'contrato' ou 'oportunidade'

  // Proteção para garantir que o tipo existe
  const stats = gerencia.types[selectedType] || { kpis: {}, chartData: [] };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Barra de Título da Gerência */}
      <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-800 rounded-sm"></span>
          {gerencia.title}
        </h2>
        
        {/* Toggle Contrato / Oportunidade */}
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => setSelectedType('contrato')}
            className={`px-4 py-1 text-sm font-medium rounded-md transition-all ${
              selectedType === 'contrato' 
                ? 'bg-white text-blue-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Contrato
          </button>
          <button
            onClick={() => setSelectedType('oportunidade')}
            className={`px-4 py-1 text-sm font-medium rounded-md transition-all ${
              selectedType === 'oportunidade' 
                ? 'bg-white text-blue-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Oportunidade
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: KPIs (3 colunas) */}
        <div className="lg:col-span-3 flex flex-col justify-center space-y-6 border-r border-gray-100 pr-4">
          
          {/* KPI Principal: Aderência */}
          <div className="text-center">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Aderência Global</span>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className={`text-4xl font-extrabold ${getAderenciaColor(stats.percentual)}`}>
                {stats.percentual}%
              </span>
              <span className="text-xs text-gray-400 font-medium">META {stats.meta}%</span>
            </div>
            {/* Barra de progresso mini */}
            <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full ${getBarColorBg(stats.percentual)}`} 
                style={{ width: `${Math.min(stats.percentual, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
             {/* Total Horas Programadas */}
             <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
              <p className="text-xs text-blue-600 font-bold uppercase">Prog (h)</p>
              <p className="text-xl font-bold text-gray-800">{stats.kpis.prog_h}</p>
              <p className="text-[10px] text-gray-500">{stats.kpis.prog_int} interv.</p>
            </div>

            {/* Total Horas Realizadas */}
            <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100">
              <p className="text-xs text-green-600 font-bold uppercase">Real (h)</p>
              <p className="text-xl font-bold text-gray-800">{stats.kpis.real_h}</p>
              <p className="text-[10px] text-gray-500">{stats.kpis.real_int} interv.</p>
            </div>
          </div>

        </div>

        {/* Coluna Direita: Gráfico (9 colunas) */}
        <div className="lg:col-span-9 h-[300px]">
          {/* Passamos o chartData com proteção */}
          <AderenciaCard 
            title={`Aderência por Período (${selectedType})`} 
            data={stats.chartData || []} 
          />
        </div>
      </div>
    </section>
  );
};

// Utilitários de cor (Tailwind classes e Hex)
const getAderenciaColor = (val) => {
  if (val >= 90) return "text-green-600";
  if (val >= 75) return "text-yellow-600";
  return "text-red-600";
};

const getBarColorBg = (val) => {
  if (val >= 90) return "bg-green-500";
  if (val >= 75) return "bg-yellow-500";
  return "bg-red-500";
};

export default OverviewPage;