import React, { useMemo } from 'react';
// Importações com chaves (Named Imports)
import { FiltersSection } from '../../components/Filters/FiltersSection';
import { AtividadesTable } from '../../components/Table/AtividadesTable';
import { useOutletContext } from 'react-router-dom';
import { useFiltering } from '../../hooks/useFiltering';
import { useSorting } from '../../hooks/useSorting';
import { useTimer } from '../../hooks/useTimer';

const DashboardPage = () => {
  const context = useOutletContext();
  
  const rawData = context?.atividadesData || [];
  const updatedRows = context?.updatedRows || new Set();
  const loading = context?.loading || false;
  const error = context?.error || null;
  const lastUpdatedTimestamp = context?.lastUpdatedTimestamp;

  // Hook de Timer para atualizar o "Tempo Real" da tabela
  const { now } = useTimer(lastUpdatedTimestamp);

  // Hook de Filtragem (Recuperando todas as opções que faltavam)
  const {
    filters,
    handleFilterChange,
    filteredData,
    gerenciaOptions,
    trechoOptions,
    ativoOptions,
    subOptions,
    atividadeOptions,
    tipoOptions,
    isAnyFilterApplied,
    displayedAdherence,
  } = useFiltering(rawData, now);

  // Hook de Ordenação
  const {
    sortedData,
    requestSort,
    getSortDirectionClass
  } = useSorting(filteredData);

  // Agrupando as props para passar para os componentes (Igual ao original)
  const optionsProps = {
    gerenciaOptions,
    trechoOptions,
    ativoOptions,
    subOptions,
    atividadeOptions,
    tipoOptions,
  };

  const adherenceProps = {
    isAnyFilterApplied,
    displayedAdherence,
  };

  if (loading && rawData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="animate-pulse">Carregando painel...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 bg-red-50 rounded-lg p-4">
        <p>Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Passando as props corretas que o componente espera */}
      <FiltersSection 
        filters={filters}
        handleFilterChange={handleFilterChange}
        options={optionsProps}
        adherence={adherenceProps}
      />
      
      <div className="flex-1 overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm relative">
        <div className="absolute inset-0 overflow-auto">
           <AtividadesTable 
             data={sortedData}
             now={now}
             updatedRows={updatedRows}
             requestSort={requestSort}
             getSortDirectionClass={getSortDirectionClass}
             loading={loading}
             rawDataCount={rawData.length}
           />
        </div>
      </div>
      
      <div className="text-xs text-gray-400 text-right px-2">
        {sortedData.length} registros exibidos
      </div>
    </div>
  );
};

export default DashboardPage;