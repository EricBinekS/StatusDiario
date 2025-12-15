import React, { useState, useMemo } from 'react';
import FiltersSection from '../../components/Dashboard/FiltersSection';
import AtividadesTable from '../../components/Dashboard/AtividadesTable';
import KPICards from '../../components/Dashboard/KPICards';
import { useDashboard } from '../../hooks/useDashboard'; 
import { Loader2, AlertCircle } from 'lucide-react';

const DashboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado dos filtros
  const [filters, setFilters] = useState({
    data: new Date().toISOString().split('T')[0], // Começa com hoje
    gerencia: [],
    trecho: [],
    sub: [],
    ativo: [],
    atividade: [],
    tipo: []
  });

  // 1. CONEXÃO: Chama a API através do Hook
  const { data: apiData, loading, error, refetch } = useDashboard(filters.data);

  // 2. EXTRAÇÃO: Gera as opções dos filtros dinamicamente baseada nos dados reais
  const options = useMemo(() => {
    if (!apiData || apiData.length === 0) return {};
    
    // Função auxiliar para pegar valores únicos e não nulos
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

  // 3. FILTRAGEM: Aplica os filtros selecionados nos dados que vieram da API
  const filteredData = useMemo(() => {
    if (!apiData) return [];

    return apiData.filter(row => {
      // Verifica cada filtro de array (MultiSelect)
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

      // Busca Global por texto
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

  // Se der erro de conexão
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
      {/* Barra de Filtros */}
      <FiltersSection 
        filters={filters} 
        setFilters={setFilters} 
        options={options}
        onClear={handleClearFilters}
      />

      {/* Estado de Carregamento */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 opacity-50">
          <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
          <span className="text-xs font-bold text-blue-900/50 uppercase tracking-widest">Carregando dados...</span>
        </div>
      ) : (
        <>
          {/* Cards de KPI (Calculados com dados reais) */}
          <KPICards data={filteredData} />
          
          {/* Tabela de Dados */}
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