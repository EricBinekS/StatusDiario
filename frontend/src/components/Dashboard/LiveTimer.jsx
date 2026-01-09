import React, { useState, useEffect } from 'react';

const LiveTimer = ({ startTime, dateRef, scheduledDuration }) => {
  const [duration, setDuration] = useState('--:--');
  // Estado inicial
  const [colorClass, setColorClass] = useState('text-amber-600 dark:text-amber-400');
  const [barColorClass, setBarColorClass] = useState('bg-amber-500');
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    // 1. Parser da Data
    const constructStartDate = () => {
      if (!startTime || startTime === '--:--' || !dateRef) return null;

      try {
        let year, month, day;
        const cleanDate = String(dateRef).trim();
        const cleanTime = String(startTime).trim();
        const now = new Date();

        if (cleanDate.includes('/')) {
            const parts = cleanDate.split('/');
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1; 
            if (parts.length === 2) {
                year = now.getFullYear();
                if (now.getMonth() === 0 && month === 11) year = year - 1;
            } else {
                year = parseInt(parts[2], 10);
            }
        } else if (cleanDate.includes('-')) {
            const parts = cleanDate.split('-');
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            day = parseInt(parts[2], 10);
        } else {
            return null;
        }

        const timeParts = cleanTime.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);

        if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) return null;

        return new Date(year, month, day, hours, minutes, 0);

      } catch (e) {
        return null;
      }
    };

    const startObj = constructStartDate();

    // 2. Parser do Tempo Programado
    let maxMinutes = 0;
    if (scheduledDuration && scheduledDuration !== '--:--') {
        try {
            const [pH, pM] = scheduledDuration.split(':').map(Number);
            maxMinutes = (pH * 60) + pM;
        } catch (e) {
            maxMinutes = 0;
        }
    }

    const updateTimer = () => {
      if (!startObj) {
        setDuration(startTime || '--:--');
        return;
      }

      const now = new Date();
      const diffMs = now - startObj;
      const diffMinutes = Math.floor(diffMs / 60000);

      if (diffMinutes < 0) {
        setDuration("00:00");
        setProgressPercent(0);
        return;
      }

      // --- LÓGICA DE CORES: 0-80% Amarelo | >80% Verde ---
      if (maxMinutes > 0) {
          const percent = (diffMinutes / maxMinutes) * 100;
          setProgressPercent(Math.min(100, percent));

          // Se já passou de 80% do tempo programado, fica Verde
          if (diffMinutes >= (maxMinutes * 0.8)) {
              setColorClass('text-emerald-600 dark:text-emerald-400');
              setBarColorClass('bg-emerald-500');
          } 
          // Caso contrário (início/meio da atividade), fica Amarelo
          else {
              setColorClass('text-amber-600 dark:text-amber-400');
              setBarColorClass('bg-amber-500');
          }
      } else {
          // Sem meta definida: Padrão Amarelo (Em andamento)
          setColorClass('text-amber-600 dark:text-amber-400');
          setBarColorClass('bg-amber-500');
          setProgressPercent(0);
      }

      const h = Math.floor(diffMinutes / 60);
      const m = diffMinutes % 60;
      setDuration(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000);

    return () => clearInterval(interval);
  }, [startTime, dateRef, scheduledDuration]);

  return (
    <div className="flex flex-col items-center justify-center w-[60px]">
      <span className={`font-bold tabular-nums text-xs transition-colors duration-300 ${colorClass}`}>
        {duration}
      </span>

      {progressPercent > 0 && (
        <div className="w-full h-0.5 bg-gray-200 dark:bg-slate-600 rounded-full mt-0.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${barColorClass}`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default LiveTimer;