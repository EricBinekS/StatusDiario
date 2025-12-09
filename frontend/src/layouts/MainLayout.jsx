import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/Header/AppHeader';
import { useFetchData } from '../hooks/useFetchData';

const MainLayout = () => {
  // Agora desestruturamos também 'updatedRows'
  const { rawData, overviewData, updatedRows, loading, error, lastUpdatedTimestamp } = useFetchData();

  const formattedDate = lastUpdatedTimestamp 
    ? lastUpdatedTimestamp.toLocaleString('pt-BR') 
    : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AppHeader 
        lastUpdate={formattedDate} 
        loading={loading}
      />
      
      <main className="flex-1 overflow-hidden relative p-4 sm:p-6">
        {/* Passamos updatedRows para baixo */}
        <Outlet context={{ 
            atividadesData: rawData, 
            overviewData, 
            updatedRows, 
            loading, 
            error,
            lastUpdatedTimestamp 
        }} />
      </main>
    </div>
  );
};

export default MainLayout;