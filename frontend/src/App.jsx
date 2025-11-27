import React from "react";
import "./index.css";

// Importando Hooks
import { useFetchData } from "./hooks/useFetchData";
import { useTimer } from "./hooks/useTimer";
import { useSorting } from "./hooks/useSorting";
import { useFiltering } from "./hooks/useFiltering";

// Importando Componentes
import { AppHeader } from "./components/Header/AppHeader";
import { AtividadesTable } from "./components/Table/AtividadesTable";
import { FiltersSection } from "./components/Filters/FiltersSection";

function App() {

  //REMOVER DEPOIS 
  const MODO_MANUTENCAO = true; 

    if (MODO_MANUTENCAO) {
        return (
          <div style={{ padding: '40px', textAlign: 'center', color: '#062e4e' }}>
            <h1>🚧 EM MANUTENÇÃO 🚧</h1>
            <p>O sistema está passando por atualizações. Voltaremos em breve.</p>
          </div>
        );
    }

  // 1. LÓGICA DE BUSCA DE DADOS E ESTADO BRUTO
  const { rawData, updatedRows, loading, lastUpdatedTimestamp, error } = useFetchData();

  // 2. LÓGICA DE TEMPO
  const { now, nextUpdateIn } = useTimer(lastUpdatedTimestamp);

  // 3. LÓGICA DE FILTRAGEM (inclui options, filteredData e adherence)
  const {
    filters,
    handleFilterChange,
    filteredData,
    gerenciaOptions,
    trechoOptions,
    subOptions,
    atividadeOptions,
    tipoOptions,
    isAnyFilterApplied,
    displayedAdherence,
  } = useFiltering(rawData, now);

  // 4. LÓGICA DE ORDENAÇÃO
  const { sortedData, requestSort, getSortDirectionClass } = useSorting(filteredData);
  
  const adherenceProps = {
    isAnyFilterApplied,
    displayedAdherence,
  };

  const optionsProps = {
    gerenciaOptions,
    trechoOptions,
    subOptions,
    atividadeOptions,
    tipoOptions,
  };

  // Se houver um erro de API, exibe-o.
  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
        <h2>Erro ao carregar o painel</h2>
        <p>Não foi possível buscar os dados da API. Tente novamente mais tarde.</p>
        <p>Detalhe: {error}</p>
      </div>
    );
  }

  return (
    <>
      <AppHeader
        lastUpdatedTimestamp={lastUpdatedTimestamp}
        nextUpdateIn={nextUpdateIn}
        loading={loading}
      />

      <main>
        <FiltersSection 
          filters={filters}
          handleFilterChange={handleFilterChange}
          options={optionsProps}
          adherence={adherenceProps}
        />
        
        <AtividadesTable
          data={sortedData}
          now={now}
          updatedRows={updatedRows}
          requestSort={requestSort}
          getSortDirectionClass={getSortDirectionClass}
          loading={loading}
          rawDataCount={rawData.length}
        />
      </main>
    </>
  );
}
export default App;