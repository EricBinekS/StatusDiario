import React, { useState } from 'react';
import OverviewCard from '../../components/Overview/OverviewCard';
import { overviewMock } from '../../data/mockData';
import { CalendarDays, CalendarRange } from 'lucide-react';

const OverviewPage = () => {
  const [viewMode, setViewMode] = useState('semana');

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Visão Gerencial</h2>
          <p className="text-xs text-slate-500">Acompanhamento consolidado</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
          <button onClick={() => setViewMode('semana')} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${viewMode === 'semana' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}><CalendarDays size={14} /> Semana</button>
          <button onClick={() => setViewMode('mes')} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${viewMode === 'mes' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}><CalendarRange size={14} /> Mês</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
        {overviewMock.map((gerencia) => (
          <OverviewCard key={gerencia.id} gerencia={gerencia} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
};
export default OverviewPage;