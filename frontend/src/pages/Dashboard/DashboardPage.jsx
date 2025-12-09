import React, { useState, useEffect, useMemo } from "react";

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
  // =========================================================================
  // 0. LÓGICA DE MANUTENÇÃO (MODO DE SEGURANÇA)
  // =========================================================================
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // ---> MUDE AQUI PARA LIGAR/DESLIGAR <---
  const MAINTENANCE_MODE = true; 
  const SECRET_PASS = 'pcm123'; // Para acessar use: /?admin=pcm123

  useEffect(() => {
    // 1. Verifica se já tem a permissão salva
    const hasAccess = localStorage.getItem('maintenance_bypass');
    
    // 2. Verifica se a URL tem a senha
    const params = new URLSearchParams(window.location.search);
    const secretKey = params.get('admin');

    if (hasAccess === 'true' || secretKey === SECRET_PASS) {
      setIsAuthorized(true);
      
      // Se entrou pela URL, salva o cookie eterno no navegador
      if (secretKey === SECRET_PASS) {
        localStorage.setItem('maintenance_bypass', 'true');
        // Limpa a URL para ficar limpa visualmente
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // 1. LÓGICA DE BUSCA DE DADOS E ESTADO BRUTO
  const { rawData, updatedRows, loading, lastUpdatedTimestamp, error } = useFetchData();

  // 2. LÓGICA DE TEMPO
  const { now, nextUpdateIn } = useTimer(lastUpdatedTimestamp);

  // 3. LÓGICA DE FILTRAGEM
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

  // 4. LÓGICA DE ORDENAÇÃO
  const { sortedData, requestSort, getSortDirectionClass } = useSorting(filteredData);
  
  // Memoização para performance (Correção anterior mantida)
  const adherenceProps = useMemo(() => ({
    isAnyFilterApplied,
    displayedAdherence,
  }), [isAnyFilterApplied, displayedAdherence]);

  const optionsProps = useMemo(() => ({
    gerenciaOptions,
    trechoOptions,
    ativoOptions,
    subOptions,
    atividadeOptions,
    tipoOptions,
  }), [gerenciaOptions, trechoOptions, ativoOptions, subOptions, atividadeOptions, tipoOptions]);


  // A. TELA DE MANUTENÇÃO
  if (MAINTENANCE_MODE && !isAuthorized) {
    return (
      <div style={{
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f4f4f9',
        color: '#333',
        fontFamily: 'sans-serif'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>🚧</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Sistema em Atualização</h2>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>Estamos implementando melhorias no Painel de Intervalos.</p>
        <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#999' }}>Equipe PCM</p>
      </div>
    );
  }

  // B. TELA DE ERRO DE API
  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
        <h2>Erro ao carregar o painel</h2>
        <p>Não foi possível buscar os dados da API. Tente novamente mais tarde.</p>
        <p>Detalhe: {error}</p>
      </div>
    );
  }

  // C. APLICATIVO NORMAL
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