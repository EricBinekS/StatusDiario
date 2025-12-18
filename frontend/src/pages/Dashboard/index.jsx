import React, { useState, useMemo, useRef } from 'react';
import FiltersSection from '../../components/Dashboard/FiltersSection';
import AtividadesTable from '../../components/Dashboard/AtividadesTable';
import KPICards from '../../components/Dashboard/KPICards';
import { useDashboard } from '../../hooks/useDashboard'; 
import { Loader2, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

const DashboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef(null); 

  const [filters, setFilters] = useState({
    data: new Date().toISOString().split('T')[0],
    gerencia: [], trecho: [], sub: [], ativo: [], atividade: [], tipo: []
  });

  const { data: apiData, loading, error, refetch } = useDashboard(filters.data);

  const options = useMemo(() => {
    if (!apiData || apiData.length === 0) return {};
    const extract = (key) => [...new Set(apiData.map(item => item[key]).filter(Boolean))].sort();
    return {
      gerencia: extract('gerencia'), trecho: extract('trecho'), sub: extract('sub'),
      ativo: extract('ativo'), atividade: extract('atividade'), tipo: extract('tipo')
    };
  }, [apiData]);

  const filteredData = useMemo(() => {
    if (!apiData) return [];
    return apiData.filter(row => {
      const checkFilter = (key) => (!filters[key] || filters[key].length === 0) || filters[key].includes(row[key]);
      if (!checkFilter('gerencia') || !checkFilter('trecho') || !checkFilter('sub') || 
          !checkFilter('ativo') || !checkFilter('atividade') || !checkFilter('tipo')) return false;

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
    setFilters(prev => ({ ...prev, gerencia: [], trecho: [], sub: [], ativo: [], atividade: [], tipo: [] }));
    setSearchTerm('');
  };

  const handleExportImage = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const canvas = await html2canvas(dashboardRef.current, {
            scale: 3, 
            backgroundColor: null, // Deixa transparente para pegar a cor da div (ou force '#f4f6f8' se quiser sempre claro)
            logging: false,
            useCORS: true,
            allowTaint: true, 
            onclone: (clonedDoc) => {
                const style = clonedDoc.createElement('style');
                style.innerHTML = `* { -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; }`;
                clonedDoc.head.appendChild(style);
                
                // Força fundo claro na exportação para garantir legibilidade, se desejar
                const element = clonedDoc.getElementById('dashboard-content');
                if(element) {
                    element.style.backgroundColor = '#f4f6f8';
                    element.classList.remove('dark'); // Remove dark mode da captura se quiser sempre claro
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
      {/* Filtros Fora da área de print para não sair na foto se não quiser */}
      <FiltersSection 
        filters={filters} 
        setFilters={setFilters} 
        options={options}
        onClear={handleClearFilters}
        onExport={handleExportImage} 
        isExporting={isExporting}    
      />

      {/* ÁREA DE CONTEÚDO (Cards + Tabela) */}
      {/* Adicionei dark:bg-slate-900 e id para o export */}
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