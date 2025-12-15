import React, { useState, useMemo } from 'react';
import FiltersSection from '../../components/Dashboard/FiltersSection';
import AtividadesTable from '../../components/Dashboard/AtividadesTable';
import KPICards from '../../components/Dashboard/KPICards';
import { useDashboard } from '../../hooks/useDashboard';
import { Loader2, AlertCircle } from 'lucide-react';

const DashboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado inicial dos filtros
  const [filters, setFilters] = useState({
    data: new Date().toISOString().split('T')[0], // Hoje
    gerencia: [],
    trecho: [],
    sub: [],
    ativo: [],
    atividade: [],
    tipo: []
  });

  // 1. CHAMADA REAL A API (Substitui o mockData)
  const { data: apiData, loading, error, refetch } = useDashboard(filters.data);

  // 2. Extração dinâmica de opções para os filtros (Baseado no que veio do banco)
  const options = useMemo(() => {
    if (!apiData || apiData.length === 0) return {};
    const extract = (key) => [...new Set(apiData.map(item => item[key]).filter(Boolean))].sort();
    
    return {
      gerencia: extract('gerencia'),
      trecho: extract('trecho'),
      sub: extract('sub'),
      ativo: extract('ativo'),
      atividade: extract('atividade'),
      tipo: extract('tipo')
    };
  }, [apiData]);

  // 3. Filtragem Local (Cliente-side)
  // O backend filtra a DATA, o frontend filtra o RESTO (para ser rápido)
  const filteredData = useMemo(() => {
    if (!apiData) return [];

    return apiData.filter(row => {
      // Verifica filtros MultiSelect
      const checkFilter = (key) => {
        if (!filters[key] || filters[key].length === 0) return true;
        return filters[key].includes(row[key]);
      };

      if (!checkFilter('gerencia')) return false;
      if (!checkFilter('trecho')) return false;
      if (!checkFilter('sub')) return false;
      if (!checkFilter('ativo')) return false;
      if (!checkFilter('atividade')) return false;
      if (!checkFilter('tipo')) return false;

      // Busca por texto livre
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const match = 
          String(row.ativo || '').toLowerCase().includes(lower) ||
          String(row.atividade || '').toLowerCase().includes(lower) ||
          String(row.detalhe || '').toLowerCase().includes(lower);
        if (!match) return false;
      }
      
      return true;
    });
  }, [apiData, filters, searchTerm]);

  const handleClearFilters = () => {
    setFilters(prev => ({
      ...prev, // Mantém a data
      gerencia: [], trecho: [], sub: [], ativo: [], atividade: [], tipo: []
    }));
    setSearchTerm('');
  };

  // Renderização de Erro
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-500 bg-white rounded-xl shadow-sm m-4 border border-red-100">
        <AlertCircle size={48} className="mb-2 opacity-50" />
        <p className="font-bold">Falha ao carregar dados</p>
        <p className="text-sm mb-4 opacity-75">{error}</p>
        <button onClick={refetch} className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-bold text-sm">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Filtros */}
      <FiltersSection 
        filters={filters} 
        setFilters={setFilters} 
        options={options}
        onClear={handleClearFilters}
        searchTerm={searchTerm} // Se quiser passar pro FiltersSection (opcional, pois removemos o input grande de lá)
      />

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 opacity-50">
          <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
          <span className="text-xs font-bold text-blue-900/50 uppercase tracking-widest">Carregando dados...</span>
        </div>
      ) : (
        <>
          {/* Cards KPI com dados reais */}
          <KPICards data={filteredData} />
          
          {/* Tabela */}
          <AtividadesTable data={filteredData} searchTerm={searchTerm} />
          
          <div className="text-right text-[10px] text-gray-400 mt-2 font-medium">
            Exibindo {filteredData.length} registros (Total do dia: {apiData.length})
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;