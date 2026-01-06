import React, { useState, useMemo, useRef } from 'react';
import FiltersSection from '../../components/Dashboard/FiltersSection';
import AtividadesTable from '../../components/Dashboard/AtividadesTable';
import KPICards from '../../components/Dashboard/KPICards';
import { useDashboard } from '../../hooks/useDashboard'; 
import { Loader2, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { getDerivedStatus } from '../../utils/dataUtils'; // <--- Importante: Usar a mesma lógica dos Cards

// Mapeia o retorno técnico do getDerivedStatus para o Texto do Filtro
const STATUS_DISPLAY_MAP = {
  'concluido': 'Concluído',
  'parcial': 'Parcial',
  'andamento': 'Em Andamento',
  'nao_iniciado': 'Não Iniciado',
  'cancelado': 'Não Realizado' // O "X" vermelho dos cards
};

const DashboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef(null); 

  // 1. Captura parâmetros da URL (enviados pelo Bot)
  const searchParams = new URLSearchParams(window.location.search);
  const urlDate = searchParams.get('data');

  const [filters, setFilters] = useState({
    // Se a URL tiver ?data=YYYY-MM-DD, usa ela. Senão, usa Hoje.
    data: urlDate || new Date().toISOString().split('T')[0],
    gerencia: [], trecho: [], sub: [], ativo: [], atividade: [], tipo: [], status: []
  });

  const { data: apiData, loading, error, refetch } = useDashboard(filters.data);

  const options = useMemo(() => {
    if (!apiData || apiData.length === 0) return {};
    const extract = (key) => [...new Set(apiData.map(item => item[key]).filter(Boolean))].sort();
    
    return {
      gerencia: extract('gerencia'), 
      trecho: extract('trecho'), 
      sub: extract('sub'),
      ativo: extract('ativo'), 
      atividade: extract('atividade'), 
      tipo: extract('tipo'),
      // As 5 opções fixas que você pediu
      status: ["Concluído", "Parcial", "Em Andamento", "Não Iniciado", "Não Realizado"]
    };
  }, [apiData]);

  const filteredData = useMemo(() => {
    if (!apiData) return [];
    
    return apiData.filter(row => {
      // Helper para checar array de filtros
      const checkFilter = (key, rowValue) => {
        return (!filters[key] || filters[key].length === 0) || filters[key].includes(rowValue);
      };

      // --- LÓGICA DE STATUS CORRIGIDA ---
      // 1. Calcula o status real (ex: 'nao_iniciado', 'parcial') usando a regra do sistema
      const technicalStatus = getDerivedStatus(row);
      // 2. Converte para o nome bonito (ex: 'Não Iniciado')
      const displayStatus = STATUS_DISPLAY_MAP[technicalStatus] || "Desconhecido";

      // Verificações Padrão
      if (!checkFilter('gerencia', row.gerencia)) return false;
      if (!checkFilter('trecho', row.trecho)) return false;
      if (!checkFilter('sub', row.sub)) return false;
      if (!checkFilter('ativo', row.ativo)) return false;
      if (!checkFilter('atividade', row.atividade)) return false;
      if (!checkFilter('tipo', row.tipo)) return false;
      
      // Verificação do Status usando o nome mapeado
      if (!checkFilter('status', displayStatus)) return false;

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
    // Ao limpar, mantemos a data atual/URL
    setFilters(prev => ({ 
        ...prev, 
        gerencia: [], trecho: [], sub: [], ativo: [], atividade: [], tipo: [], status: [] 
    }));
    setSearchTerm('');
  };

  const handleExportImage = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const canvas = await html2canvas(dashboardRef.current, {
            scale: 3, 
            backgroundColor: null, 
            logging: false,
            useCORS: true,
            allowTaint: true, 
            onclone: (clonedDoc) => {
                const style = clonedDoc.createElement('style');
                style.innerHTML = `* { -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; }`;
                clonedDoc.head.appendChild(style);
                
                const element = clonedDoc.getElementById('dashboard-content');
                if(element) {
                    element.style.backgroundColor = '#f4f6f8';
                    element.classList.remove('dark'); 
                }
            }
        });
        
        canvas.toBlob(async (blob) => {
            try {
                if (!blob) throw new Error("Falha ao gerar imagem");
                const item = new ClipboardItem({ "image/png": blob });
                await navigator.clipboard.write([item]);
                console.log("Imagem copiada!");
            } catch (err) {
                console.error("Erro clipboard:", err);
                alert("Verifique permissões do navegador.");
            }
        }, 'image/png', 1.0);

    } catch (err) {
        console.error("Erro html2canvas:", err);
        alert("Erro ao processar imagem.");
    } finally {
        setIsExporting(false);
    }
  };

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
    <div className="flex flex-col gap-4">
      <FiltersSection 
        filters={filters} 
        setFilters={setFilters} 
        options={options}
        onClear={handleClearFilters}
        onExport={handleExportImage} 
        isExporting={isExporting}    
      />

      <div ref={dashboardRef} id="dashboard-content" className="flex flex-col bg-[#f4f6f8] dark:bg-slate-900 transition-colors p-1 rounded-xl"> 
        {loading ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50">
            <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mb-2" size={40} />
            <span className="text-xs font-bold text-blue-900/50 dark:text-blue-100/50 uppercase tracking-widest">Carregando dados...</span>
            </div>
        ) : (
            <>
            <KPICards data={filteredData} />
            <AtividadesTable data={filteredData} searchTerm={searchTerm} />
            <div className="text-right text-[10px] text-gray-400 mt-2 font-medium px-2">
                Exibindo {filteredData.length} registros (Total do dia: {apiData.length})
            </div>
            </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;