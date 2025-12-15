import React, { useMemo } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import useFiltering from '../../hooks/useFiltering';
import FiltersSection from '../../components/Dashboard/FiltersSection';
import AtividadesTable from '../../components/Dashboard/AtividadesTable';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const DashboardPage = () => {
  const { data: rawData, loading } = useDashboard();
  
  const {
    filters,
    setFilters,
    filteredData,
    filterOptions,
    resetFilters
  } = useFiltering(rawData);

  // Cálculo dos Cards de Resumo (KPIs rápidos)
  const stats = useMemo(() => {
    const total = filteredData.length;
    const concluido = filteredData.filter(d => ['CONCLUIDO', 'CONCLUÍDO'].includes(d.status?.toUpperCase())).length;
    const andamento = filteredData.filter(d => d.status?.toUpperCase() === 'EM ANDAMENTO').length;
    const programado = filteredData.filter(d => d.status?.toUpperCase() === 'PROGRAMADO').length;
    
    return { total, concluido, andamento, programado };
  }, [filteredData]);

  if (loading) return <div className="p-10"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      {/* Cards de Resumo (Estilo MKP) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total de Atividades" value={stats.total} color="blue" />
        <SummaryCard label="Concluídas" value={stats.concluido} color="green" />
        <SummaryCard label="Em Andamento" value={stats.andamento} color="yellow" />
        <SummaryCard label="Aguardando / Programado" value={stats.programado} color="gray" />
      </div>

      {/* Área de Filtros e Tabela */}
      <div className="bg-white rounded shadow border border-slate-200">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
           <FiltersSection 
              filters={filters} 
              setFilters={setFilters} 
              options={filterOptions} 
              onClear={resetFilters}
           />
        </div>
        
        <AtividadesTable data={filteredData} />
        
        <div className="bg-slate-50 px-4 py-2 text-xs text-slate-500 text-right border-t border-slate-200">
          Mostrando {filteredData.length} registros
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, color }) => {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
    gray: "bg-slate-50 border-slate-200 text-slate-800"
  };

  return (
    <div className={`p-4 rounded border ${colors[color]} flex flex-col items-center justify-center shadow-sm`}>
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-xs uppercase font-semibold opacity-70 mt-1">{label}</span>
    </div>
  );
};

export default DashboardPage;