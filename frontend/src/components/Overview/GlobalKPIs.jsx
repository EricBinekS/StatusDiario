import React, { useMemo } from 'react';
import { Clock, CheckCircle2, TrendingUp } from 'lucide-react';

const GlobalKPIs = ({ data }) => {
  const totals = useMemo(() => {
    let progH = 0;
    let realH = 0;
    
    data.forEach(group => {
      progH += group.types.contrato.kpis.prog_h + group.types.oportunidade.kpis.prog_h;
      realH += group.types.contrato.kpis.real_h + group.types.oportunidade.kpis.real_h;
    });

    const percent = progH > 0 ? (realH / progH) * 100 : 0;
    return { progH, realH, percent };
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">Horas Programadas</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totals.progH.toFixed(1)}h</h3>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
          <Clock className="text-blue-600 dark:text-blue-400" size={24} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">Horas Realizadas</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totals.realH.toFixed(1)}h</h3>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-lg">
          <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={24} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">Aderência Global</p>
          <h3 className={`text-2xl font-bold ${totals.percent >= 85 ? 'text-emerald-600' : 'text-amber-500'}`}>
            {totals.percent.toFixed(1)}%
          </h3>
        </div>
        <div className={`p-3 rounded-lg ${totals.percent >= 85 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-amber-50 dark:bg-amber-900/30'}`}>
          <TrendingUp className={totals.percent >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'} size={24} />
        </div>
      </div>
    </div>
  );
};

export default GlobalKPIs;