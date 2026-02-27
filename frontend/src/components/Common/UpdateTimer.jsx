import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';

const UpdateTimer = ({ seconds }) => {
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  // 600 segundos = 10 minutos (100%)
  const percentage = (seconds / 600) * 100;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3600 segundos = 1 hora (100%)
  const TOTAL_SECONDS = 3600;
  const percentage = (seconds / TOTAL_SECONDS) * 100;
  const isExpired = seconds === 0;

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
          {isExpired ? "Aguardando Atualização" : "Próxima Atualização"}
        </p>
        <p className={`text-xs font-mono font-bold flex items-center justify-end gap-1.5 tabular-nums ${isExpired ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
          {formatTime(seconds)} 
          {isExpired ? (
            <AlertCircle size={12} className="text-red-500 animate-pulse" />
          ) : (
            <Clock size={12} className="text-blue-600 dark:text-blue-400 animate-pulse" />
          )}
        </p>
      </div>
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          {/* Círculo de Fundo (Trilho) */}
          <path 
            className="text-gray-200 dark:text-slate-700" 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
          />
          {/* Círculo de Progresso */}
          <path 
            className={`${isExpired ? 'text-red-500' : 'text-blue-600 dark:text-blue-500'} transition-all duration-1000 ease-linear`}
            strokeDasharray={`${percentage}, 100`} 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
          />
        </svg>
      </div>
    </div>
  );
};

export default UpdateTimer;
