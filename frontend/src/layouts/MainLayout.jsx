import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppHeader from '../components/Header/AppHeader';
import { useFetchData } from '../hooks/useFetchData';
import useFetchOverview from '../hooks/useFetchOverview'; 

const MainLayout = () => {
  const location = useLocation();

  const { data: rawData, loading: loadingData, error: errorData, refetch: refetchData } = useFetchData();

  const { overviewData, loading: loadingOverview, error: errorOverview, refetch: refetchOverview } = useFetchOverview();

  const handleRefresh = () => {
    refetchData();
    refetchOverview();
  };

  const isOverview = location.pathname === '/overview';
  const isLoading = isOverview ? loadingOverview : loadingData;
  const error = isOverview ? errorOverview : errorData;

  const lastUpdate = new Date(); 

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {!isOverview && (
        <AppHeader 
          lastUpdate={lastUpdate} 
          onRefresh={handleRefresh} 
          loading={isLoading}
        />
      )}

      <main className="flex-grow">
        <Outlet context={{ 
          rawData, 
          loadingData, 
          errorData, 
          overviewData, 
          loadingOverview, 
          errorOverview,
          handleRefresh 
        }} />
      </main>
    </div>
  );
};

export default MainLayout;