import React, { useState, useMemo, useRef } from 'react';
import FiltersSection from '../../components/Dashboard/FiltersSection';
import AtividadesTable from '../../components/Dashboard/AtividadesTable';
import KPICards from '../../components/Dashboard/KPICards';
import { useDashboard } from '../../hooks/useDashboard'; 
import { Loader2, AlertCircle, MessageCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { getDerivedStatus } from '../../utils/dataUtils';

const STATUS_DISPLAY_MAP = {
  'concluido': 'Concluído',
  'parcial': 'Parcial',
  'andamento': 'Em Andamento',
  'nao_iniciado': 'Não Iniciado',
  'cancelado': 'Não Realizado'
};

const DashboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef(null); 

  const searchParams = new URLSearchParams(window.location.search);
  const urlDate = searchParams.get('data');
  const today = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    dataInicio: urlDate || today,
    dataFim: urlDate || today,
    gerencia: [], trecho: [], sub: [], ativo: [], atividade: [], tipo: [], status: []
  });

  const { data: apiData = [], loading, error, refetch } = useDashboard(filters.dataInicio, filters.dataFim);

  // --- LÓGICA DE CASCATA (CROSS-FILTERING) ---
  const options = useMemo(() => {
    if (!apiData || apiData.length === 0) return {};

    const getOptionsFor = (targetKey) => {
        const filteredData = apiData.filter(row => {
            return Object.keys(filters).every(filterKey => {
                if (filterKey === targetKey || filterKey === 'dataInicio' || filterKey === 'dataFim') return true;

                const selectedValues = filters[filterKey];
                if (!selectedValues || selectedValues.length === 0) return true;

                let rowValue;
                if (filterKey === 'status') {
                    const techStatus = getDerivedStatus(row);
                    rowValue = STATUS_DISPLAY_MAP[techStatus] || "Desconhecido";
                } else {
                    rowValue = row[filterKey];
                }
                return selectedValues.includes(String(rowValue));
            });
        });

        const uniqueValues = new Set();
        filteredData.forEach(item => {
            const val = item[targetKey];
            if (val) uniqueValues.add(val);
        });

        return [...uniqueValues].sort();
    };

    return {
      gerencia: getOptionsFor('gerencia'), 
      trecho: getOptionsFor('trecho'), 
      sub: getOptionsFor('sub'),
      ativo: getOptionsFor('ativo'), 
      atividade: getOptionsFor('atividade'), 
      tipo: getOptionsFor('tipo'),
      status: ["Concluído", "Parcial", "Em Andamento", "Não Iniciado", "Não Realizado"]
    };
  }, [apiData, filters]);

  // --- FILTRAGEM ---
  const filteredData = useMemo(() => {
    if (!apiData) return [];
    
    return apiData.filter(row => {
      const checkFilter = (key, rowValue) => {
        return (!filters[key] || filters[key].length === 0) || filters[key].includes(String(rowValue));
      };

      const technicalStatus = getDerivedStatus(row);
      const displayStatus = STATUS_DISPLAY_MAP[technicalStatus] || "Desconhecido";

      if (!checkFilter('gerencia', row.gerencia)) return false;
      if (!checkFilter('trecho', row.trecho)) return false;
      if (!checkFilter('sub', row.sub)) return false;
      if (!checkFilter('ativo', row.ativo)) return false;
      if (!checkFilter('atividade', row.atividade)) return false;
      if (!checkFilter('tipo', row.tipo)) return false;
      
      if (filters.status && filters.status.length > 0 && !filters.status.includes(displayStatus)) return false;

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
    <div className="flex flex-col gap-3 pb-4">
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
                Exibindo {filteredData.length} registros (Total do período: {apiData.length})
            </div>
            </>
        )}
      </div>

      {/* --- RODAPÉ COMPACTO v3.2 --- */}
      <footer className="mt-2 flex flex-col md:flex-row justify-between items-center gap-2 border-t border-gray-200 dark:border-slate-700 pt-3 px-2">
        <div className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
          <span>Desenvolvido por <strong className="text-gray-600 dark:text-slate-400">Eric Binek</strong></span>
          <span className="mx-1.5 opacity-50">•</span>
          <span>v3.2</span>
          <span className="mx-1.5 opacity-50">•</span>
          <span>{new Date().getFullYear()}</span>
        </div>

        <a 
            href="https://wa.me/5541998630158?text=Ol%C3%A1%2C%20estou%20com%20d%C3%BAvidas%20no%20Dashboard." 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 group no-underline"
        >
            <MessageCircle size={14} className="text-white fill-white/20" />
            <span className="font-bold text-[10px] tracking-wide">Suporte WhatsApp</span>
        </a>
      </footer>
    </div>
  );
};

export default DashboardPage;