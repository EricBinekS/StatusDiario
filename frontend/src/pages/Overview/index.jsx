import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOverview } from '../../hooks/useOverview';
import OverviewCard from '../../components/Overview/OverviewCard';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

const OverviewPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view') === 'mes' ? 'mes' : 'semana';
  const [viewMode, setViewMode] = useState(viewParam);

  const { data, loading, error, refetch } = useOverview(viewMode);

  const handleViewChange = (mode) => {
    setViewMode(mode);
    setSearchParams({ view: mode });
  };

  if (loading) return <LoadingSpinner />;
  if (error || data.length === 0) return <ErrorMessage message={error || "Sem dados."} onRetry={refetch} />;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visão Gerencial</h1>
          <p className="text-sm text-gray-500">Acompanhamento de aderência e horas realizadas</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-1 rounded-lg shadow-sm border">
          <button
            onClick={() => handleViewChange('semana')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'semana' ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => handleViewChange('mes')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'mes' ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Mês
          </button>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto space-y-8 w-full">
        {data.map((gerencia) => (
          <OverviewCard key={gerencia.id} gerencia={gerencia} />
        ))}
      </div>
    </div>
  );
};

export default OverviewPage;