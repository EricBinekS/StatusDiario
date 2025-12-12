import React from 'react';
import AderenciaChart from './AderenciaChart';

const OverviewCard = ({ gerencia }) => {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-3">
        <div className="w-1.5 h-6 bg-blue-900 rounded-full"></div>
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
          {gerencia.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
        
        <TypeSection 
          type="CONTRATO" 
          stats={gerencia.types.contrato} 
          color="blue"
        />

        <TypeSection 
          type="OPORTUNIDADE" 
          stats={gerencia.types.oportunidade} 
          color="indigo"
        />

      </div>
    </section>
  );
};

const TypeSection = ({ type, stats, color }) => {
  const isBlue = color === 'blue';
  const titleColor = isBlue ? 'text-blue-700' : 'text-indigo-700';
  const bgColor = isBlue ? 'bg-blue-50' : 'bg-indigo-50';

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <span className={`text-xs font-black px-2 py-1 rounded ${bgColor} ${titleColor} tracking-wider`}>
          {type}
        </span>
        <div className="text-right">
          <span className={`text-3xl font-extrabold ${getScoreColor(stats.percentual)}`}>
            {stats.percentual}%
          </span>
          <p className="text-[10px] text-gray-400 font-medium">ADERÊNCIA (META {stats.meta}%)</p>
        </div>
      </div>

      <div className="flex-grow min-h-[220px] mb-6">
        <AderenciaChart data={stats.chartData} color={color} />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-auto">
        <div className="border border-gray-100 rounded p-2 text-center">
          <p className="text-[10px] text-gray-400 uppercase">Programado</p>
          <p className="text-sm font-bold text-gray-700">{stats.kpis.prog_h}h</p>
          <p className="text-[9px] text-gray-400">{stats.kpis.prog_int} interv.</p>
        </div>
        <div className="border border-gray-100 rounded p-2 text-center bg-gray-50">
          <p className="text-[10px] text-gray-400 uppercase">Realizado</p>
          <p className="text-sm font-bold text-gray-700">{stats.kpis.real_h}h</p>
          <p className="text-[9px] text-gray-400">{stats.kpis.real_int} interv.</p>
        </div>
      </div>
    </div>
  );
};

const getScoreColor = (val) => {
  if (val >= 90) return "text-green-600";
  if (val >= 75) return "text-yellow-600";
  return "text-red-500";
};

export default OverviewCard;