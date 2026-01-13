import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend, Cell, PieChart, Pie, AreaChart, Area 
} from 'recharts';

// CORES IGUAIS AO KPICards
const COLORS = {
  concluido: '#22c55e',     
  parcial: '#f97316',       
  andamento: '#eab308',     
  nao_iniciado: '#94a3b8',  
  cancelado: '#ef4444',     
  prog: '#cbd5e1',    
  real: '#3b82f6'     
};

const AnalyticsView = ({ data, viewMode }) => {
  
  // 1. Gráfico de Barras: Comparativo por Gerência (Horas)
  const barData = useMemo(() => {
    return data.map(item => ({
      name: item.title,
      progContrato: item.types.contrato.kpis.prog_h,
      realContrato: item.types.contrato.kpis.real_h,
      progOportunidade: item.types.oportunidade.kpis.prog_h,
      realOportunidade: item.types.oportunidade.kpis.real_h,
      totalProg: item.types.contrato.kpis.prog_h + item.types.oportunidade.kpis.prog_h,
      totalReal: item.types.contrato.kpis.real_h + item.types.oportunidade.kpis.real_h,
    }));
  }, [data]);

  // 2. Gráfico de Rosca: Status Global
  const statusData = useMemo(() => {
    let counts = { concluido: 0, parcial: 0, andamento: 0, nao_iniciado: 0, cancelado: 0 };
    
    data.forEach(group => {
      ['contrato', 'oportunidade'].forEach(type => {
        const bd = group.types[type].kpis.breakdown;
        counts.concluido += bd.concluido || 0;
        counts.parcial += bd.parcial || 0;
        counts.andamento += bd.andamento || 0;
        counts.nao_iniciado += bd.nao_iniciado || 0;
        counts.cancelado += bd.cancelado || 0;
      });
    });

    return [
      { name: 'Concluído', value: counts.concluido, color: COLORS.concluido },
      { name: 'Parcial', value: counts.parcial, color: COLORS.parcial },
      { name: 'Em Andamento', value: counts.andamento, color: COLORS.andamento },
      { name: 'Não Iniciado', value: counts.nao_iniciado, color: COLORS.nao_iniciado },
      { name: 'Não Realizado', value: counts.cancelado, color: COLORS.cancelado },
    ].filter(d => d.value > 0);
  }, [data]);

  // 3. Gráfico de Área/Barra: Evolução Temporal
  const trendData = useMemo(() => {
    const timeMap = {};
    
    data.forEach(group => {
      ['contrato', 'oportunidade'].forEach(type => {
        const charts = group.types[type].chartData || [];
        charts.forEach(point => {
          if (!timeMap[point.name]) timeMap[point.name] = { name: point.name, prog: 0, real: 0 };
          timeMap[point.name].prog += point.prog;
          timeMap[point.name].real += point.real;
        });
      });
    });

    const values = Object.values(timeMap);
    
    // Ordenação inteligente
    if (viewMode === 'hoje') {
        // Ordena por hora (ex: "09h", "10h")
        return values.sort((a, b) => parseInt(a.name) - parseInt(b.name));
    } else {
        // Ordena por dia da semana
        const daysOrder = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
        return values.sort((a, b) => {
            const idxA = daysOrder.indexOf(a.name);
            const idxB = daysOrder.indexOf(b.name);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            return a.name.localeCompare(b.name);
        });
    }
  }, [data, viewMode]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg text-xs z-50">
          <p className="font-bold mb-2 text-slate-700 dark:text-slate-200">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-slate-500 dark:text-slate-400 capitalize">{entry.name}:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                {entry.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
      
      {/* 1. Status das Atividades (Donut) */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm min-h-[26rem] flex flex-col">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Status das Atividades</h3>
        <p className="text-xs text-slate-500 mb-4">Quantidade de apontamentos por situação.</p>
        <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                >
                {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={72} iconType="circle" wrapperStyle={{ fontSize: '11px' }}/>
            </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Evolução da Produção (Area ou Bar) */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm min-h-[26rem] flex flex-col">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
            {viewMode === 'hoje' ? 'Produção por Hora (Hoje)' : 'Evolução da Produção (Horas)'}
        </h3>
        <p className="text-xs text-slate-500 mb-4">Programado vs Realizado {viewMode === 'hoje' ? 'por faixa horária' : 'acumulado'}.</p>
        <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
            
            {/* SWITCH INTELIGENTE: Se for 'hoje', usa Barras (discreto). Se não, usa Área (contínuo) */}
            {viewMode === 'hoje' ? (
                <BarChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="prog" name="Programado" fill={COLORS.prog} radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="real" name="Realizado" fill={COLORS.real} radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
            ) : (
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.real} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.real} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.prog} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.prog} stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={{fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="prog" name="Programado" stroke={COLORS.prog} fillOpacity={1} fill="url(#colorProg)" strokeWidth={2} />
                    <Area type="monotone" dataKey="real" name="Realizado" stroke={COLORS.real} fillOpacity={1} fill="url(#colorReal)" strokeWidth={3} />
                </AreaChart>
            )}
            
            </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Desempenho por Gerência (Bar) */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm h-96 flex flex-col">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Desempenho Geral por Gerência (Horas)</h3>
        <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                <Bar dataKey="totalProg" name="Programado (h)" fill={COLORS.prog} radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalReal" name="Realizado (h)" fill={COLORS.real} radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.totalReal >= entry.totalProg * 0.85 ? COLORS.concluido : COLORS.real} />
                    ))}
                </Bar>
            </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default AnalyticsView;