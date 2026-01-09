import React, { useState, useMemo, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { getDerivedStatus } from '../../utils/dataUtils';
import { MAINTENANCE_CONFIG } from '../../config/maintenanceConfig';

// Importando os novos componentes/hooks
import FiltersSection from '../../components/Dashboard/FiltersSection';
import DashboardContent from '../../components/Dashboard/DashboardContent';
import MaintenanceScreen from '../../components/Common/MaintenanceScreen';
import { useDashboardExport } from '../../hooks/useDashboardExport';

const STATUS_DISPLAY_MAP = {
  'concluido': 'Concluído',
  'parcial': 'Parcial',
  'andamento': 'Em Andamento',
  'nao_iniciado': 'Não Iniciado',
  'cancelado': 'Não Realizado'
};

const DashboardPage = () => {
  // 1. Verificação de Manutenção
  if (MAINTENANCE_CONFIG.dashboard) {
    return <MaintenanceScreen moduleName="Operacional (Dashboard)" />;
  }

  // 2. Estados e Dados
  const [searchTerm, setSearchTerm] = useState('');
  const dashboardRef = useRef(null); 
  const { isExporting, handleExportImage } = useDashboardExport(dashboardRef); // Hook customizado

  const searchParams = new URLSearchParams(window.location.search);
  const urlDate = searchParams.get('data');
  const today = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    dataInicio: urlDate || today,
    dataFim: urlDate || today,
    gerencia: [], trecho: [], sub: [], ativo: [], atividade: [], tipo: [], status: []
  });

  const { data: apiData = [], loading, error, refetch } = useDashboard(filters.dataInicio, filters.dataFim);

  // 3. Lógica de Filtros (Options Cascata)
  const options = useMemo(() => {
    if (!apiData || apiData.length === 0) return {};
    const getOptionsFor = (targetKey) => {
        const filteredData = apiData.filter(row => {
            return Object.keys(filters).every(filterKey => {
                if (filterKey === targetKey || filterKey === 'dataInicio' || filterKey === 'dataFim') return true;
                const selectedValues = filters[filterKey];
                if (!selectedValues || selectedValues.length === 0) return true;
                
                let rowValue = row[filterKey];
                if (filterKey === 'status') {
                    const techStatus = getDerivedStatus(row);
                    rowValue = STATUS_DISPLAY_MAP[techStatus] || "Desconhecido";
                }
                return selectedValues.includes(String(rowValue));
            });
        });
        const uniqueValues = new Set(filteredData.map(item => item[targetKey]).filter(Boolean));
        return [...uniqueValues].sort();
    };

    return {
      gerencia: getOptionsFor('gerencia'), trecho: getOptionsFor('trecho'), sub: getOptionsFor('sub'),
      ativo: getOptionsFor('ativo'), atividade: getOptionsFor('atividade'), tipo: getOptionsFor('tipo'),
      status: ["Concluído", "Parcial", "Em Andamento", "Não Iniciado", "Não Realizado"]
    };
  }, [apiData, filters]);

  // 4. Lógica de Filtragem de Dados (Tabela)
  const filteredData = useMemo(() => {
    if (!apiData) return [];
    return apiData.filter(row => {
      // Filtros Dropdown
      const passFilters = Object.keys(filters).every(key => {
         if (key === 'dataInicio' || key === 'dataFim' || !filters[key].length) return true;
         
         let rowVal = String(row[key]);
         if (key === 'status') {
             const techStatus = getDerivedStatus(row);
             rowVal = STATUS_DISPLAY_MAP[techStatus] || "Desconhecido";
         }
         return filters[key].includes(rowVal);
      });
      if (!passFilters) return false;

      // Filtro de Texto
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        return String(row.ativo || '').toLowerCase().includes(lower) ||
               String(row.atividade || '').toLowerCase().includes(lower) ||
               String(row.detalhe || '').toLowerCase().includes(lower);
      }
      return true;
    });
  }, [apiData, filters, searchTerm]);

  const handleClearFilters = () => {
    setFilters(prev => ({ ...prev, gerencia: [], trecho: [], sub: [], ativo: [], atividade: [], tipo: [], status: [] }));
    setSearchTerm('');
  };

  // 5. Renderização
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-500 bg-white dark:bg-slate-800 rounded-xl shadow-sm m-4 border border-red-100 dark:border-red-900">
        <AlertCircle size={48} className="mb-2 opacity-50" />
        <p className="font-bold">Falha ao carregar dados</p>
        <button onClick={refetch} className="mt-4 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Seção de Filtros */}
      <FiltersSection 
        filters={filters} 
        setFilters={setFilters} 
        options={options} 
        onClear={handleClearFilters}
        onExport={handleExportImage} 
        isExporting={isExporting}    
      />

      {/* Área de Conteúdo (KPIs + Tabela) */}
      <DashboardContent 
        ref={dashboardRef}
        loading={loading}
        filteredData={filteredData}
        totalRecords={apiData.length}
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default DashboardPage;