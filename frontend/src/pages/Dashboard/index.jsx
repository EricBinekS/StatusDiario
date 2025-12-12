import React from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import useFiltering from '../../hooks/useFiltering';
import FiltersSection from '../../components/Dashboard/FiltersSection'; 
import AtividadesTable from '../../components/Dashboard/AtividadesTable';
import LoadingSpinner from '../../components/Common/LoadingSpinner'; 
import ErrorMessage from '../../components/Common/ErrorMessage';     

const DashboardPage = () => {
  const { data: rawData, loading, error, refetch } = useDashboard();
  
  const {
    filters,
    setFilters,
    filteredData,
    filterOptions,
    resetFilters
  } = useFiltering(rawData);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-900">Painel Operacional</h1>
        <button onClick={refetch} className="text-sm text-blue-600 hover:underline">
          Atualizar Dados
        </button>
      </div>

      <FiltersSection 
        filters={filters} 
        setFilters={setFilters} 
        options={filterOptions} 
        onClear={resetFilters}
      />

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500 flex justify-between">
            <span>Exibindo {filteredData.length} registros</span>
            <span>Total: {rawData.length}</span>
        </div>
        <AtividadesTable data={filteredData} />
      </div>
    </div>
  );
};

export default DashboardPage;