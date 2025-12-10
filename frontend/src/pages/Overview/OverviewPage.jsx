import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import AderenciaCard from '../../components/Overview/AderenciaCard';
import { Calendar, BarChart2 } from 'lucide-react';

const OverviewPage = () => {
  // Assume-se que o context pode expor uma função para atualizar filtros (ex: setGlobalFilters)
  // Se não expor, você precisará implementar o fetch localmente ou ajustar o MainLayout.
  const { overviewData, loading, error, setGlobalFilters } = useOutletContext();
  
  const [activeCardId, setActiveCardId] = useState(null);
  const [viewMode, setViewMode] = useState('semana'); // 'semana' | 'mes'

  // Efeito para atualizar os dados quando o modo mudar
  useEffect(() => {
    if (setGlobalFilters) {
      // Calcula datas baseadas no modo (exemplo simplificado)
      const now = new Date();
      let startStr = '';
      let endStr = now.toISOString().split('T')[0];
      
      if (viewMode === 'semana') {
        // Pega o domingo da semana atual ou 7 dias atrás
        const prev = new Date(now);
        prev.setDate(now.getDate() - 7);
        startStr = prev.toISOString().split('T')[0];
      } else {
        // Pega o dia 1 do mês atual
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        startStr = firstDay.toISOString().split('T')[0];
      }

      setGlobalFilters({
        startDate: startStr,
        endDate: endStr,
        viewMode: viewMode
      });
    }
  }, [viewMode, setGlobalFilters]);

  const handleCardClick = (id) => {
    setActiveCardId(prev => prev === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-2 pb-4">
      {/* Cabeçalho Interno com Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-[#062e4e]">Overview Gerencial</h2>
            <p className="text-gray-500 text-sm mt-1">Aderência por Contrato e Oportunidade</p>
        </div>

        {/* Toggle Switch */}
        <div className="bg-gray-100 p-1 rounded-lg flex items-center border border-gray-200">
            <button
                onClick={() => setViewMode('semana')}
                className={`
                    flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200
                    ${viewMode === 'semana' 
                        ? 'bg-white text-[#062e4e] shadow-sm ring-1 ring-gray-200' 
                        : 'text-gray-500 hover:text-gray-700'}
                `}
            >
                <Calendar size={14} />
                Semana
            </button>
            <button
                onClick={() => setViewMode('mes')}
                className={`
                    flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200
                    ${viewMode === 'mes' 
                        ? 'bg-white text-[#062e4e] shadow-sm ring-1 ring-gray-200' 
                        : 'text-gray-500 hover:text-gray-700'}
                `}
            >
                <BarChart2 size={14} />
                Mês
            </button>
        </div>
      </div>

      {/* Loading / Error States */}
      {loading && (
        <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
           <div className="animate-pulse">Carregando indicadores...</div>
        </div>
      )}
      
      {error && !loading && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-center">
            Erro ao carregar dados. Tente recarregar a página.
        </div>
      )}

      {!loading && !error && (!overviewData || overviewData.length === 0) && (
         <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-100 dashed">
            Nenhum dado disponível para o período selecionado.
         </div>
      )}

      {/* Grid de Cards */}
      {!loading && !error && overviewData && overviewData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {overviewData.map((item) => (
              <AderenciaCard 
                key={item.id}
                data={item}
                isOpen={activeCardId === item.id}
                onClick={() => handleCardClick(item.id)}
              />
            ))}
          </div>
      )}
    </div>
  );
};

export default OverviewPage;