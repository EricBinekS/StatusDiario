import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/Header/AppHeader';
import { useFetchData } from '../hooks/useFetchData';
import { useFetchOverview } from '../hooks/useFetchOverview'; // <--- Importe o novo hook

const MainLayout = () => {
  // Estado para os filtros globais (Data e Modo de Visualização)
  const [globalFilters, setGlobalFilters] = useState({
    startDate: '', // Será preenchido pelo OverviewPage
    endDate: '',
    viewMode: 'semana'
  });

  // Hooks de Dados
  const { rawData, loading: dataLoading, error: dataError, lastUpdatedTimestamp } = useFetchData();
  
  // Hook do Overview (Passamos os filtros para ele)
  const { overviewData, loading: overviewLoading, error: overviewError } = useFetchOverview(globalFilters);

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa]">
      <AppHeader lastUpdate={lastUpdatedTimestamp} />
      
      <main className="flex-1 overflow-hidden p-4">
        {/* Passamos tudo via Context para as páginas filhas (Dashboard e Overview) */}
        <Outlet context={{ 
          // Dados da Tabela (Dashboard)
          rawData, 
          loading: dataLoading, 
          error: dataError,
          
          // Dados do Overview
          overviewData,
          overviewLoading, // Renomeado para não conflitar
          overviewError,
          
          // Controle de Filtros (Para o OverviewPage poder mudar a data/modo)
          globalFilters,
          setGlobalFilters
        }} />
      </main>
    </div>
  );
};

export default MainLayout;