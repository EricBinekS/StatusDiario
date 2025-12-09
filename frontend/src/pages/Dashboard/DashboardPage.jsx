import React, { useMemo } from 'react';
import { FiltersSection } from '../../components/Filters/FiltersSection';
import { AtividadesTable } from '../../components/Table/AtividadesTable';
import { useOutletContext } from 'react-router-dom';
import { useFiltering } from '../../hooks/useFiltering'; 
import { useSorting } from '../../hooks/useSorting';

const DashboardPage = () => {
  const context = useOutletContext();
  
  const rawData = context?.atividadesData || [];
  const loading = context?.loading || false;
  const error = context?.error || null;

  const {
    filters,
    handleFilterChange,
    filteredData: rawFilteredData
  } = useFiltering(rawData);

  const {
    sortedData,
    sortConfig,
    requestSort
  } = useSorting(rawFilteredData);

  const tableData = useMemo(() => sortedData, [sortedData]);

  if (loading && rawData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="animate-pulse">Carregando dados do painel...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 bg-red-50 rounded-lg p-4">
        <p>Erro de conexão: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <FiltersSection 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        data={rawData} 
      />
      
      <div className="flex-1 overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm relative">
        <div className="absolute inset-0 overflow-auto">
           <AtividadesTable 
             data={tableData} 
             sortConfig={sortConfig}
             onSort={requestSort}
           />
        </div>
      </div>
      
      <div className="text-xs text-gray-400 text-right px-2">
        {tableData.length} registros exibidos
      </div>
    </div>
  );
};

export default DashboardPage;