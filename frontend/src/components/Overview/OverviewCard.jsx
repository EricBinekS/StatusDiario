import React, { useState } from 'react';
import AderenciaChart from './AderenciaChart';
import { Clock, CheckCircle2, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OverviewCard = ({ gerencia, viewMode }) => {
  const [activeTab, setActiveTab] = useState(null);
  const handleTabClick = (tab) => setActiveTab(activeTab === tab ? null : tab);

  return (
    // DARK: bg-white -> dark:bg-slate-800 | border-gray-200 -> dark:border-slate-700
    <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 transition-all duration-300 flex flex-col rounded-[20px] overflow-hidden h-fit hover:shadow-md">
      
      {/* Header do Card */}
      <div className="p-4 flex flex-col bg-white dark:bg-slate-800 relative z-10 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Indicador lateral */}
            <div className={`w-1.5 h-6 rounded-full transition-colors duration-300 ${activeTab ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}></div>
            {/* Título: dark:text-white */}
            <h3 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wide leading-none mt-1">{gerencia.title}</h3>
          </div>
          {/* Botão Fechar/Abrir: dark:hover:bg-slate-700 */}
          <button onClick={() => activeTab ? setActiveTab(null) : setActiveTab('contrato')} className="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700">
            {activeTab ? <X size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {/* Badges Grandes */}
        <div className="flex flex-row items-center justify-between gap-4 w-full mt-1 relative">
          <BigBadge label="Contrato" type="contrato" value={gerencia.types.contrato.percentual} meta={gerencia.types.contrato.meta} color="blue" activeTab={activeTab} onClick={() => handleTabClick('contrato')} />
          {/* Divisória Vertical: dark:bg-slate-700 */}
          <div className={`w-px h-10 bg-gray-100 dark:bg-slate-700 mx-1 transition-opacity duration-300 ${activeTab ? 'opacity-0' : 'opacity-100'}`}></div>
          <BigBadge label="Oportunidade" type="oportunidade" value={gerencia.types.oportunidade.percentual} meta={gerencia.types.oportunidade.meta} color="purple" activeTab={activeTab} onClick={() => handleTabClick('oportunidade')} />
        </div>
      </div>

      {/* Área Expansível (AnimatePresence mantido) */}
      <AnimatePresence mode="wait">
        {activeTab && (
          <motion.div key={activeTab} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden bg-gray-50/30 dark:bg-slate-900/30 border-t border-gray-100 dark:border-slate-700">
            <div className="p-4">
              {activeTab === 'contrato' ? <MetricSection type="Contrato" data={gerencia.types.contrato} theme="blue" viewMode={viewMode} /> : <MetricSection type="Oportunidade" data={gerencia.types.oportunidade} theme="purple" viewMode={viewMode} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BigBadge = ({ label, type, value, meta, color, activeTab, onClick }) => {
  const isBlue = color === 'blue';
  const isActive = activeTab === type;
  const isInactive = activeTab && activeTab !== type;
  const scoreColor = value >= meta ? 'text-green-600 dark:text-green-400' : (value >= meta * 0.8 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500 dark:text-red-400');

  // DARK: hover:bg-gray-50 -> dark:hover:bg-slate-700
  return (
    <div onClick={onClick} className={`flex flex-col flex-1 items-center text-center justify-center py-2 rounded-xl cursor-pointer transition-all duration-300 ${isActive ? 'scale-105' : isInactive ? 'scale-95 opacity-40 grayscale blur-[0.5px]' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
      {/* Label Badge: bg-gray-100 -> dark:bg-slate-700 | text-gray-500 -> dark:text-gray-300 */}
      <span className="text-[9px] font-bold uppercase tracking-wider mb-0.5 px-2 py-px rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300">{label}</span>
      <div className="flex flex-col items-center leading-none">
        <span className={`font-black tracking-tighter transition-all duration-300 ${isActive ? 'text-6xl mt-2 mb-1' : 'text-4xl'} ${scoreColor}`}>{value}%</span>
        {/* Meta: text-gray-400 -> dark:text-gray-500 */}
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Meta: {meta}%</span>
      </div>
      <div className={`h-1.5 w-16 rounded-full mt-2 transition-all duration-300 ${isActive ? (isBlue ? 'bg-blue-500' : 'bg-purple-500') : 'bg-transparent'}`}></div>
    </div>
  );
};

const MetricSection = ({ type, data, theme, viewMode }) => {
  const isBlue = theme === 'blue';
  // Ajustei cores de texto para Dark
  const textClass = isBlue ? "text-blue-900 dark:text-blue-300" : "text-purple-900 dark:text-purple-300";
  let chartDataToUse = [];
  if (data.chartData) {
    if (Array.isArray(data.chartData)) chartDataToUse = data.chartData;
    else if (data.chartData[viewMode]) chartDataToUse = data.chartData[viewMode];
  }
  const displayChartData = (chartDataToUse && chartDataToUse.length > 0) ? chartDataToUse : [{name:'-', prog:0, real:0}];

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      <div className="flex items-center gap-2 mb-3">
        <h4 className={`text-[10px] font-bold uppercase tracking-widest ${isBlue ? 'text-blue-400' : 'text-purple-400'}`}>Detalhes de {type} ({viewMode})</h4>
        <div className="h-px bg-gray-200 dark:bg-slate-600 flex-grow"></div>
      </div>
      
      {/* Gráfico Container: bg-white -> dark:bg-slate-800 | border-gray-100 -> dark:border-slate-700 */}
      <div className="h-40 w-full mb-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3 shadow-inner"> 
        <AderenciaChart data={displayChartData} color={theme} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Bloco Programado */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5 flex items-center gap-1"><Clock size={10} /> Programado</p>
            <span className="text-xl font-bold text-gray-700 dark:text-gray-200 leading-none tabular-nums">{data.kpis.prog_h}h</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-gray-400 block tabular-nums">{data.kpis.prog_int}</span>
            <span className="text-[9px] text-gray-300 uppercase">Int.</span>
          </div>
        </div>

        {/* Bloco Realizado */}
        {/* O fundo colorido (blue-50) precisa de ajuste dark. Usei dark:bg-blue-900/20 */}
        <div className={`rounded-xl p-3 border flex items-center justify-between ${isBlue ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' : 'bg-purple-50/50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800'}`}>
          <div>
            <p className={`text-[9px] uppercase font-bold mb-0.5 flex items-center gap-1 ${isBlue ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`}><CheckCircle2 size={10} /> Realizado</p>
            <span className={`text-xl font-bold leading-none tabular-nums ${textClass}`}>{data.kpis.real_h}h</span>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold block tabular-nums ${isBlue ? 'text-blue-400' : 'text-purple-400'}`}>{data.kpis.real_int}</span>
            <span className={`text-[9px] uppercase ${isBlue ? 'text-blue-300' : 'text-purple-300'}`}>Int.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OverviewCard;