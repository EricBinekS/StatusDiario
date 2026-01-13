import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import KPICards from './KPICards';
import AtividadesTable from './AtividadesTable';

// Usamos forwardRef para permitir que o hook de exportação acesse a div
const DashboardContent = forwardRef(({ loading, data, filteredData, totalRecords, searchTerm }, ref) => {
  
  // Garante compatibilidade se o pai passar 'data' ou 'filteredData'
  const displayData = filteredData || data || [];
  // Se totalRecords não vier, usa o tamanho do array
  const displayTotal = totalRecords ?? displayData.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 opacity-50">
        <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mb-2" size={40} />
        <span className="text-xs font-bold text-blue-900/50 dark:text-blue-100/50 uppercase tracking-widest">
          Carregando dados...
        </span>
      </div>
    );
  }

  return (
    <div ref={ref} id="dashboard-content" className="flex flex-col bg-[#f4f6f8] dark:bg-slate-900 transition-colors p-1 rounded-xl">
      <KPICards data={displayData} />
      <AtividadesTable data={displayData} searchTerm={searchTerm} />
      
      <div className="text-right text-[10px] text-gray-400 mt-2 font-medium px-2">
        Exibindo {displayData.length} registros (Total do período: {displayTotal})
      </div>
    </div>
  );
});

export default DashboardContent;