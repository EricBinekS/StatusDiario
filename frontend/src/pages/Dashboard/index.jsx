import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  // CORREÇÃO: Gerências iniciam vazias para serem preenchidas pelo banco
  const [options, setOptions] = useState({
    gerencia: [],
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

  // Extração dinâmica de opções com REGRAS DE FILTRO
  useEffect(() => {
    if (data && data.length > 0) {
        const extractUnique = (key) => {
            return [...new Set(data.map(item => item[key]).filter(Boolean))].sort();
        };

        const todasGerencias = extractUnique('gerencia_da_via');
        
        // FILTRO: Remove Mecanização e Outros da lista de opções de Gerência
        const gerenciasFiltradas = todasGerencias.filter(g => {
            const upper = g.toUpperCase();
            return !upper.includes('MECANIZA') && !upper.includes('OUTROS');
        });

        setOptions(prev => ({
            ...prev,
            gerencia: gerenciasFiltradas,
            ativo: extractUnique('ativo'),
            atividade: extractUnique('atividade'),
            trecho: extractUnique('trecho'),
            sub: extractUnique('sub'),
        }));
    }
  }, [data]);

  const handleClearFilters = () => {
    setFilters(prev => ({
      ...prev,
      gerencia: [], trecho: [], sub: [], ativo: [], atividade: [], tipo: [], status: []
    }));
  };

  const filteredData = useMemo(() => {
      if (!data) return [];
      return data.filter(row => {
          if (filters.gerencia.length > 0 && !filters.gerencia.includes(row.gerencia_da_via)) return false;
          if (filters.trecho.length > 0 && !filters.trecho.includes(row.trecho)) return false;
          if (filters.sub.length > 0 && !filters.sub.includes(row.sub)) return false;
          
          if (filters.ativo.length > 0 && !filters.ativo.includes(row.ativo)) return false;
          if (filters.atividade.length > 0 && !filters.atividade.includes(row.atividade)) return false;
          if (filters.status.length > 0) {
             const s = (row.status || '').toUpperCase();
             if (!filters.status.includes(s)) return false;
          }
          if (filters.tipo.length > 0) {
             const t = (row.tipo || '').toUpperCase();
             const match = filters.tipo.some(ft => t.includes(ft));
             if (!match) return false;
          }
          return true;
      });
  }, [data, filters]);

  return (
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
            <DashboardContent 
                data={data} 
                filteredData={filteredData} 
                loading={loading} 
            />
        </div>
    </div>
  );
};
export default DashboardPage;