import { useState, useMemo } from 'react';
import { normalizeText } from '../utils/formatters';

const useFiltering = (data) => {
  const [filters, setFilters] = useState({
    gerencia_da_via: [],
    atividade: [],
    status: [],
    data: '' // Data específica se necessário
  });

  // Extrai opções únicas baseadas nos dados carregados
  const filterOptions = useMemo(() => {
    if (!data || data.length === 0) return { gerencia_da_via: [], atividade: [], status: [] };

    const extractUnique = (key) => 
      [...new Set(data.map(item => normalizeText(item[key])).filter(Boolean))].sort();

    return {
      gerencia_da_via: extractUnique('gerencia_da_via'),
      atividade: extractUnique('atividade'),
      status: extractUnique('status') // ou 'operational_status'
    };
  }, [data]);

  // Aplica os filtros
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    return data.filter(row => {
      // Filtro de Gerência
      if (filters.gerencia_da_via.length > 0) {
        if (!filters.gerencia_da_via.includes(normalizeText(row.gerencia_da_via))) return false;
      }
      
      // Filtro de Atividade
      if (filters.atividade.length > 0) {
        if (!filters.atividade.includes(normalizeText(row.atividade))) return false;
      }

      // Filtro de Status
      if (filters.status.length > 0) {
        const rowStatus = normalizeText(row.status) || normalizeText(row.operational_status);
        if (!filters.status.includes(rowStatus)) return false;
      }

      // Filtro de Data (Exato)
      if (filters.data) {
        // Assume formato YYYY-MM-DD ou ISO no row.data
        const rowDate = row.data ? new Date(row.data).toISOString().split('T')[0] : '';
        if (rowDate !== filters.data) return false;
      }

      return true;
    });
  }, [data, filters]);

  const resetFilters = () => {
    setFilters({ gerencia_da_via: [], atividade: [], status: [], data: '' });
  };

  return {
    filters,
    setFilters,
    filteredData,
    filterOptions,
    resetFilters
  };
};

export default useFiltering;