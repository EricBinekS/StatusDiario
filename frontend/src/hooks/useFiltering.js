import { useState, useMemo } from "react";
import { getTodaysDateStringForReact } from "../utils/dateUtils";
import { getUniqueOptions, calculateAdherence } from "../utils/dataUtils"; 

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
    
    // Lógica de cascata para limpar filtros 'filhos'
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
    }
    setFilters(newFilters);
  };

  // --- 1. Lógica de Filtragem de Dados (Business Logic) ---
  const sortedAndFilteredData = useMemo(() => {
    if (!Array.isArray(rawData)) return [];

    let filterableData = rawData.filter((row) => {
      // Filtro de Data
      if (filters.data && (!row.data || !row.data.startsWith(filters.data)))
        return false;

      // Filtro de Texto (Ativo)
      if (
        filters.ativo &&
        (!row.ativo ||
          !String(row.ativo)
            .toLowerCase()
            .includes(filters.ativo.toLowerCase()))
      )
        return false;

      // Filtros Multi-Seleção (Gerência, Trecho, Sub, Atividade, Tipo)
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


  // --- 2. Lógica para as Opções de Filtro (Cascata) ---
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


  // --- 3. Lógica de Aderência e Status de Filtro ---
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
    return calculateAdherence(sortedAndFilteredData, now);
  }, [sortedAndFilteredData, now]);

  const displayedAdherence = useMemo(() => {
    return isAnyFilterApplied ? filteredAdherence : globalAdherence;
  }, [isAnyFilterApplied, filteredAdherence, globalAdherence]);


  return {
    filters,
    handleFilterChange,
    filteredData: sortedAndFilteredData,
    gerenciaOptions,
    trechoOptions,
    subOptions,
    atividadeOptions,
    tipoOptions,
    isAnyFilterApplied,
    displayedAdherence,
  };
};