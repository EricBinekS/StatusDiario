import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/Header/AppHeader';
import { useFetchData } from '../hooks/useFetchData';

const MainLayout = () => {
  // O Layout é o "pai" que busca os dados uma única vez
  const { rawData, overviewData, loading, error, lastUpdatedTimestamp } = useFetchData();

  // Formata a data para o Header
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
        {/* Disponibiliza os dados para Dashboard e Overview via Contexto */}
        <Outlet context={{ 
            atividadesData: rawData, 
            overviewData: overviewData, 
            loading, 
            error 
        }} />
      </main>
    </div>
  );
};

export default MainLayout;