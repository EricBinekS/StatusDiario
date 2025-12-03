import { useState, useMemo, useCallback } from "react";
import { getTodaysDateStringForReact } from "../utils/dateUtils";
import { getUniqueOptions } from "../utils/dataUtils"; 
import { calculateAdherence } from "../utils/calcUtils"; 
import { useStableArray } from "./useStableArray"; 

export const useFiltering = (rawData, now) => {
  const [filters, setFilters] = useState({
    data: getTodaysDateStringForReact(),
    gerencia: [],
    trecho: [],
    sub: [],
    ativo: [], 
    atividade: [],
    tipo: [],
  });

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters, [filterName]: value };
      
      if (filterName === "gerencia") {
        newFilters.trecho = [];
        newFilters.sub = [];
        newFilters.ativo = [];
        newFilters.atividade = [];
        newFilters.tipo = [];
      }
      if (filterName === "trecho") {
        newFilters.sub = [];
        newFilters.ativo = [];
        newFilters.atividade = [];
        newFilters.tipo = [];
      }
      if (filterName === "sub") {
        newFilters.ativo = [];
        newFilters.atividade = [];
        newFilters.tipo = [];
      }
      return newFilters;
    });
  }, []);

  const unstableFilteredData = useMemo(() => {
    if (!Array.isArray(rawData)) return [];

    let filterableData = rawData.filter((row) => {
      if (filters.data && (!row.data || !row.data.startsWith(filters.data)))
        return false;

      if (filters.ativo.length > 0 && !filters.ativo.includes(String(row.ativo)))
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

  const filteredData = useStableArray(unstableFilteredData);

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

  const ativoOptions = useMemo(() => {
    let d = rawData;
    if (filters.gerencia.length > 0)
      d = d.filter((r) => filters.gerencia.includes(String(r.gerência_da_via)));
    if (filters.trecho.length > 0)
      d = d.filter((r) => filters.trecho.includes(String(r.coordenação_da_via)));
    if (filters.sub.length > 0) 
      d = d.filter((r) => filters.sub.includes(String(r.sub)));
    return getUniqueOptions(d, "ativo");
  }, [rawData, filters.gerencia, filters.trecho, filters.sub]);

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

  const isAnyFilterApplied = useMemo(() => {
    if (!filters) return false;
    return Object.entries(filters).some(([key, v]) => {
      if (key === 'data') return v !== getTodaysDateStringForReact();
      // Verificação para Arrays (agora inclui 'ativo')
      return Array.isArray(v) && v.length > 0;
    });
  }, [filters]);

  const globalAdherence = useMemo(() => calculateAdherence(rawData, now), [rawData, now]);
  const filteredAdherence = useMemo(() => calculateAdherence(filteredData, now), [filteredData, now]); 
  const displayedAdherence = useMemo(() => isAnyFilterApplied ? filteredAdherence : globalAdherence, [isAnyFilterApplied, filteredAdherence, globalAdherence]);

  return {
    filters,
    handleFilterChange,
    filteredData, 
    gerenciaOptions,
    trechoOptions,
    subOptions,
    ativoOptions, 
    atividadeOptions,
    tipoOptions,
    isAnyFilterApplied,
    displayedAdherence,
  };
};