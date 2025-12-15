import React, { useState, useMemo } from 'react';
import FiltersSection from '../../components/Dashboard/FiltersSection';
import AtividadesTable from '../../components/Dashboard/AtividadesTable';
import KPICards from '../../components/Dashboard/KPICards';
import { painelData } from '../../data/mockData';

const DashboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ data: '2025-12-09', gerencia: [], trecho: [], sub: [], ativo: [], atividade: [], tipo: [] });

  const options = useMemo(() => {
    const extract = (key) => [...new Set(painelData.map(item => item[key]).filter(Boolean))].sort();
    return { gerencia: extract('gerencia'), trecho: extract('trecho'), sub: extract('sub'), ativo: extract('ativo'), atividade: extract('atividade'), tipo: extract('tipo') };
  }, []);

  const filteredData = useMemo(() => {
    return painelData.filter(row => {
      const checkFilter = (key) => filters[key].length === 0 || filters[key].includes(row[key]);
      if (!checkFilter('ativo') || !checkFilter('atividade')) return false;
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const match = String(row.ativo).toLowerCase().includes(lower) || String(row.atividade).toLowerCase().includes(lower) || String(row.detalhe).toLowerCase().includes(lower);
        if (!match) return false;
      }
      return true;
    });
  }, [filters, searchTerm]);

  const handleClearFilters = () => {
    setFilters({ data: filters.data, gerencia: [], trecho: [], sub: [], ativo: [], atividade: [], tipo: [] });
    setSearchTerm('');
  };

  return (
    <div className="flex flex-col">
      <FiltersSection filters={filters} setFilters={setFilters} options={options} onClear={handleClearFilters} />
      <KPICards data={filteredData} />
      <AtividadesTable data={filteredData} searchTerm={searchTerm} />
      <div className="text-right text-[10px] text-gray-500 mt-2">Mostrando {filteredData.length} de {painelData.length} registros</div>
    </div>
  );
};
export default DashboardPage;