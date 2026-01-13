import React, { useState, useEffect, useCallback } from 'react';
import DashboardContent from '../../components/Dashboard/DashboardContent';
import FiltersSection from '../../components/Dashboard/FiltersSection';
import { getDashboardData } from '../../services/dashboardService';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
  const [filters, setFilters] = useState({
    data: new Date().toISOString().split('T')[0], 
    gerencia: [],
    trecho: [],
    sub: [],
    ativo: [],
    atividade: [],
    tipo: [],
    status: []
  });

  const [options, setOptions] = useState({
    gerencia: ['FERRONORTE', 'SP_NORTE', 'SP_SUL', 'MALHA CENTRAL', 'MODERNIZACAO', 'MECANIZACAO'],
    trecho: [], sub: [], ativo: [], atividade: [], tipo: ['CONTRATO', 'OPORTUNIDADE']
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDashboardData(filters.data); 
      setData(result || []);
    } catch (error) {
      console.error("Erro dashboard:", error);
      toast.error("Erro ao atualizar dados");
    } finally {
      setLoading(false);
    }
  }, [filters.data]); 

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClearFilters = () => {
    setFilters(prev => ({
      ...prev,
      gerencia: [], trecho: [], sub: [], ativo: [], atividade: [], tipo: [], status: []
    }));
  };

  return (
    // p-2: Padding pequeno nas laterais (não cola na borda, mas usa quase tudo)
    // gap-3: Cria o espaço entre o Filtro e o DashboardContent
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900/50 flex flex-col p-2 gap-3">
        
        <FiltersSection 
            filters={filters} 
            setFilters={setFilters} 
            options={options} 
            onClear={handleClearFilters} 
            onExport={() => {}} 
            isExporting={false} 
        />
        
        <div className="flex-1 w-full">
            <DashboardContent data={data} loading={loading} />
        </div>
    </div>
  );
};
export default DashboardPage;