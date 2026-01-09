import React from 'react';
import LiveTimer from './LiveTimer';
import { getDerivedStatus } from '../../utils/dataUtils';

const MobileActivityCard = ({ row }) => {
  // Lógica de Cores (Duplicada aqui para garantir encapsulamento visual)
  const getStatusColorClass = (rowData) => {
    const status = getDerivedStatus(rowData);
    switch (status) {
        case 'concluido': return 'bg-[#28a745] ring-[#28a745]'; 
        case 'cancelado': return 'bg-[#ef4444] ring-[#ef4444]'; 
        case 'parcial': return 'bg-[#fd7e14] ring-[#fd7e14]';   
        case 'andamento': return 'bg-[#ffc107] ring-[#ffc107]'; 
        case 'nao_iniciado': return 'bg-[#6c757d] ring-[#6c757d]'; 
        default: return 'bg-[#6c757d] ring-[#6c757d]';
    }
  };

  const statusAtual = getDerivedStatus(row);
  const temInicio = row.inicio.real && row.inicio.real !== '--:--';
  const isAndamento = statusAtual === 'andamento' || row.status === 'Em andamento';
  const isBloco = row.tempo.prog === '00:01';
  const showTimer = isAndamento && temInicio && !isBloco;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
      {/* Cabeçalho do Card */}
      <div className="flex justify-between items-start mb-3 border-b border-gray-100 dark:border-slate-700 pb-2">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Atividade</span>
          <div className="font-bold text-slate-800 dark:text-white text-sm">{row.ativo}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.atividade}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`w-3 h-3 rounded-full ${getStatusColorClass(row)}`}></div>
          <span className="text-[10px] font-mono text-gray-400">{row.data}</span>
        </div>
      </div>

      {/* Grid de Informações */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <MobileInfoBlock label="Início (Prog | Real)" value={
          <div className="flex gap-1.5 font-mono text-xs">
            <span className="text-gray-500">{row.inicio.prog}</span>
            <span className="text-gray-300">|</span>
            <span className={temInicio ? 'text-slate-800 dark:text-white font-bold' : 'text-gray-400'}>
              {row.inicio.real}
            </span>
          </div>
        } />
        
        <MobileInfoBlock label="Tempo (Prog | Real)" value={
          isBloco ? (
            <span className="bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 dark:border-slate-600 inline-block uppercase tracking-widest select-none">
              BLOCO
            </span>
          ) : (
            <div className="flex gap-1.5 font-mono text-xs">
              <span className="text-gray-500">{row.tempo.prog}</span>
              <span className="text-gray-300">|</span>
              {showTimer ? (
                <LiveTimer 
                  startTime={row.inicio.real} 
                  dateRef={row.data} 
                  scheduledDuration={row.tempo.prog} 
                />
              ) : (
                <span className={`font-bold ${row.tempo.real === '--:--' ? 'text-gray-400' : 'text-slate-800 dark:text-white'}`}>
                  {row.tempo.real}
                </span>
              )}
            </div>
          )
        } />
        
        <MobileInfoBlock label="Local" value={
          <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
            {row.local.real !== '-' ? row.local.real : row.local.prog}
          </div>
        } />
        
        <MobileInfoBlock label="Quantidade" value={
          <div className="text-xs text-gray-600 dark:text-gray-300">
            {row.quant.real !== '0' ? row.quant.real : row.quant.prog}
          </div>
        } />
      </div>

      {/* Detalhamento */}
      <div className="bg-gray-50 dark:bg-slate-700/50 p-2 rounded-lg border border-gray-100 dark:border-slate-700">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Detalhamento</span>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
          {row.detalhamento || "—"}
        </p>
      </div>
    </div>
  );
};

// Subcomponente simples para manter o layout alinhado
const MobileInfoBlock = ({ label, value }) => (
  <div>
    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">{label}</span>
    {value}
  </div>
);

export default MobileActivityCard;