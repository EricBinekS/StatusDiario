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
            
            backgroundColor: '#f4f6f8', 
            logging: false,
            useCORS: true,
            allowTaint: true, 
            
            onclone: (clonedDoc) => {
                const style = clonedDoc.createElement('style');
                style.innerHTML = `
                    * {
                        -webkit-font-smoothing: antialiased !important;
                        -moz-osx-font-smoothing: grayscale !important;
                        text-rendering: optimizeLegibility !important;
                        /* Tenta evitar que bordas finas sumam no redimensionamento */
                        box-shadow: 0 0 1px rgba(0,0,0,0.01); 
                    }
                `;
                clonedDoc.head.appendChild(style);
            }
        });

        canvas.toBlob(async (blob) => {
            try {
                if (!blob) throw new Error("Falha ao gerar imagem");
                
                const item = new ClipboardItem({ "image/png": blob });
                await navigator.clipboard.write([item]);
                
                console.log("Imagem de alta qualidade copiada para a área de transferência.");
            } catch (err) {
                console.error("Erro ao copiar para o clipboard:", err);
                
                alert("Não foi possível copiar automaticamente. Verifique as permissões.");
            }
        }, 'image/png', 1.0);

    } catch (err) {
        console.error("Erro crítico no html2canvas:", err);
        alert("Erro ao processar a imagem do painel.");
    } finally {
        setIsExporting(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-500 bg-white rounded-xl shadow-sm m-4 border border-red-100">
        <AlertCircle size={48} className="mb-2 opacity-50" />
        <p className="font-bold">Falha ao carregar dados</p>
        <p className="text-sm mb-4 opacity-75">{error}</p>
        <button onClick={refetch} className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-bold text-sm">Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <FiltersSection 
        filters={filters} 
        setFilters={setFilters} 
        options={options}
        onClear={handleClearFilters}
        onExport={handleExportImage} 
        isExporting={isExporting}    
      />

      <div ref={dashboardRef} className="flex flex-col bg-[#f4f6f8]"> 
        <div className="p-1"> 
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-50">
                <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
                <span className="text-xs font-bold text-blue-900/50 uppercase tracking-widest">Carregando dados...</span>
                </div>
            ) : (
                <>
                <KPICards data={filteredData} />
                <AtividadesTable data={filteredData} searchTerm={searchTerm} />
                <div className="text-right text-[10px] text-gray-400 mt-2 font-medium">
                    Exibindo {filteredData.length} registros (Total do dia: {apiData.length})
                </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;