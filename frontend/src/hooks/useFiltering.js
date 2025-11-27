import { useState, useMemo } from "react";
import { getTodaysDateStringForReact } from "../utils/dateUtils";
import { getUniqueOptions } from "../utils/dataUtils"; 
import { calculateAdherence } from "../utils/calcUtils"; 

export const useFiltering = (rawData, now) => {
  const [filters, setFilters] = useState({
    data: getTodaysDateStringForReact(),
    gerencia: [],
    trecho: [],
    sub: [],
    ativo: "",
    atividade: [],
    tipo: [],
  });

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    
    if (filterName === "gerencia") {
      newFilters.trecho = [];
      newFilters.sub = [];
      newFilters.atividade = [];
      newFilters.tipo = [];
    }
    if (filterName === "trecho") {
      newFilters.sub = [];
      newFilters.atividade = [];
      newFilters.tipo = [];
    }
    if (filterName === "sub") {
      newFilters.atividade = [];
      newFilters.tipo = [];
      newFilters.tipo = [];
    }
    setFilters(newFilters);
  };

  // 1. Lógica de Filtragem (Gera array instável)
  const unstableFilteredData = useMemo(() => {
    if (!Array.isArray(rawData)) return [];

    let filterableData = rawData.filter((row) => {
      if (filters.data && (!row.data || !row.data.startsWith(filters.data)))
        return false;

      if (
        filters.ativo &&
        (!row.ativo ||
          !String(row.ativo)
            .toLowerCase()
            .includes(filters.ativo.toLowerCase()))
      )
        return false;

      if (filters.gerencia.length > 0 && !filters.gerencia.includes(String(row.gerência_da_via)))
        return false;
      if (filters.trecho.length > 0 && !filters.trecho.includes(String(row.coordenação_da_via)))
        return false;
      if (filters.sub.length > 0 && !filters.sub.includes(String(row.sub)))
        return false;
      if (filters.atividade.length > 0 && !filters.atividade.includes(String(row.atividade)))
        return false;
      if (filters.tipo.length > 0 && !filters.tipo.includes(String(row.tipo)))
        return false;

      return true;
    });

    return filterableData;
  }, [rawData, filters]);

  // 2. CORREÇÃO: Estabiliza a referência do array de dados
  const filteredData = useMemo(() => {
    // Cria uma chave estável baseada no conteúdo do array
    const stableKey = JSON.stringify(unstableFilteredData);

    // Retorna o array instável. O useMemo garante que esta função só será executada
    // se a chave (o conteúdo do array) mudar.
    return unstableFilteredData;
  }, [unstableFilteredData]); // A dependência real é o array instável

  // --- 3. Lógica para as Opções de Filtro (Cascata) ---
  const gerenciaOptions = useMemo(
    () => getUniqueOptions(rawData, "gerência_da_via"),
    [rawData]
  );

  const trechoOptions = useMemo(() => {
    let d = rawData;
    if (filters.gerencia.length > 0)
      d = d.filter((r) => filters.gerencia.includes(String(r.gerência_da_via)));
    return getUniqueOptions(d, "coordenação_da_via");
  }, [rawData, filters.gerencia]);

  const subOptions = useMemo(() => {
    let d = rawData;
    if (filters.gerencia.length > 0)
      d = d.filter((r) => filters.gerencia.includes(String(r.gerência_da_via)));
    if (filters.trecho.length > 0)
      d = d.filter((r) => filters.trecho.includes(String(r.coordenação_da_via)));
    return getUniqueOptions(d, "sub");
  }, [rawData, filters.gerencia, filters.trecho]);

  const atividadeOptions = useMemo(() => {
    let d = rawData;
    if (filters.gerencia.length > 0)
      d = d.filter((r) => filters.gerencia.includes(String(r.gerência_da_via)));
    if (filters.trecho.length > 0)
      d = d.filter((r) => filters.trecho.includes(String(r.coordenação_da_via)));
    if (filters.sub.length > 0) 
      d = d.filter((r) => filters.sub.includes(String(r.sub)));
    return getUniqueOptions(d, "atividade");
  }, [rawData, filters.gerencia, filters.trecho, filters.sub]);

  const tipoOptions = useMemo(() => {
    let d = rawData;
    if (filters.gerencia.length > 0)
      d = d.filter((r) => filters.gerencia.includes(String(r.gerência_da_via)));
    if (filters.trecho.length > 0)
      d = d.filter((r) => filters.trecho.includes(String(r.coordenação_da_via)));
    if (filters.sub.length > 0) 
      d = d.filter((r) => filters.sub.includes(String(r.sub)));
    return getUniqueOptions(d, "tipo");
  }, [rawData, filters.gerencia, filters.trecho, filters.sub]);


  // --- 4. Lógica de Aderência e Status de Filtro ---
  const isAnyFilterApplied = useMemo(() => {
    if (!filters) return false;
    return Object.entries(filters).some(([key, v]) => {
      if (key === 'data') {
        return v !== getTodaysDateStringForReact();
      }
      if (key === 'ativo') {
        return String(v).trim() !== "";
      }
      return Array.isArray(v) && v.length > 0;
    });
  }, [filters]);

  const globalAdherence = useMemo(() => {
    return calculateAdherence(rawData, now);
  }, [rawData, now]);

  const filteredAdherence = useMemo(() => {
    return calculateAdherence(filteredData, now); 
  }, [filteredData, now]); 

  const displayedAdherence = useMemo(() => {
    return isAnyFilterApplied ? filteredAdherence : globalAdherence;
  }, [isAnyFilterApplied, filteredAdherence, globalAdherence]);


  return {
    filters,
    handleFilterChange,
    filteredData, // Agora é o array estável
    gerenciaOptions,
    trechoOptions,
    subOptions,
    atividadeOptions,
    tipoOptions,
    isAnyFilterApplied,
    displayedAdherence,
  };
};