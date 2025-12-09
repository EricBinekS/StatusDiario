import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import AderenciaCard from '../../components/Overview/AderenciaCard';

const OverviewPage = () => {
  const { overviewData, loading, error } = useOutletContext();
  const [activeCardId, setActiveCardId] = useState(null);

  const handleCardClick = (id) => {
    setActiveCardId(prev => prev === id ? null : id);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando indicadores...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Erro ao carregar dados.</div>;
  if (!overviewData || overviewData.length === 0) return <div className="p-8 text-center text-gray-500">Nenhum dado de overview disponível.</div>;

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-2 pb-4">
      {/* Cabeçalho Interno */}
      <div className="flex justify-between items-end mb-6">
        <div>
            <h2 className="text-2xl font-bold text-[#062e4e]">Overview Gerencial</h2>
            <p className="text-gray-500 text-sm mt-1">Aderência por Contrato e Oportunidade</p>
        </div>
      </div>

      {/* Grid de Cards */}
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
    </div>
  );
};

export default OverviewPage;