import React, { useState, useEffect } from 'react';

const LiveTimer = ({ startTime, dateRef, scheduledDuration }) => {
  const [duration, setDuration] = useState('--:--');
  // Começa verde por padrão (text-emerald-600)
  const [colorClass, setColorClass] = useState('text-emerald-600 dark:text-emerald-400');

  useEffect(() => {
    const constructStartDate = () => {
      if (!startTime || startTime === '--:--' || !dateRef) return null;

      try {
        let year, month, day;
        const cleanDate = String(dateRef).trim();
        const cleanTime = String(startTime).trim();
        const now = new Date();

        // --- PARSER DE DATA (IGUAL AO ANTERIOR) ---
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

    // --- PARSER DO TEMPO PROGRAMADO (Ex: "02:00" -> 120 min) ---
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
        return;
      }

      // --- LÓGICA DAS CORES ---
      if (maxMinutes > 0) {
          // Se já estourou o tempo (Vermelho)
          if (diffMinutes > maxMinutes) {
              setColorClass('text-red-600 dark:text-red-500 animate-pulse'); // Vermelho alerta
          } 
          // Se está nos ultimos 10% do tempo (Laranja)
          // Ex: Meta 60min. 90% = 54min. Se atual >= 54, fica laranja.
          else if (diffMinutes >= (maxMinutes * 0.9)) {
              setColorClass('text-orange-500 dark:text-orange-400');
          } 
          // Tempo confortável (Verde)
          else {
              setColorClass('text-emerald-600 dark:text-emerald-400');
          }
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
    <span className={`font-bold tabular-nums transition-colors duration-500 ${colorClass}`}>
      {duration}
    </span>
  );
};

export default LiveTimer;