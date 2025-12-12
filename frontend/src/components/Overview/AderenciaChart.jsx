import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const AderenciaChart = ({ data, color }) => {
  const isBlue = color === 'blue';
  const colorProg = isBlue ? '#93c5fd' : '#a5b4fc'; 
  const colorReal = isBlue ? '#1e40af' : '#3730a3'; 

  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 text-xs">
        Sem dados para gráfico
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 5, right: 0, left: -25, bottom: 0 }}
      >
        <CartesianGrid vertical={false} stroke="#f3f4f6" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{fontSize: 10, fill: '#9ca3af'}} 
          interval={0}
        />
        <YAxis 
          tickLine={false} 
          axisLine={false} 
          tick={{fontSize: 10, fill: '#9ca3af'}} 
        />
        <Tooltip 
          cursor={{ fill: 'transparent' }}
          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
          labelStyle={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}
          itemStyle={{fontSize: '12px', padding: 0}}
        />
        <Bar dataKey="prog" name="Programado" fill={colorProg} radius={[2, 2, 0, 0]} barSize={12} />
        <Bar dataKey="real" name="Realizado" fill={colorReal} radius={[2, 2, 0, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AderenciaChart;