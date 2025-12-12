import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const AderenciaCard = ({ title, data, type = "gerencia" }) => {
  const getBarColor = (aderencia) => {
    if (aderencia >= 90) return "#22c55e"; // green-500
    if (aderencia >= 80) return "#eab308"; // yellow-500
    return "#ef4444"; // red-500
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded text-sm">
          <p className="font-bold text-gray-800 mb-1">{item.nome}</p>
          <p className="text-gray-600">
            Aderência: <span className="font-bold" style={{ color: getBarColor(item.aderencia) }}>{item.aderencia}%</span>
          </p>
          <div className="mt-2 text-xs text-gray-500 border-t pt-2">
            <p>Prog: {item.horas_prog}h</p>
            <p>Real: {item.horas_real}h</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md h-64 flex items-center justify-center">
        <span className="text-gray-400">Sem dados para o período</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">{title}</h3>
      </div>
      
      <div className="flex-grow min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis 
              dataKey="nome" 
              type="category" 
              width={100} 
              tick={{ fontSize: 11, fill: '#4b5563' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            
            <Bar dataKey="aderencia" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.aderencia)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legenda de apoio */}
      <div className="mt-4 flex justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>&lt; 75%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>75-90%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>&gt; 90%</span>
        </div>
      </div>
    </div>
  );
};

export default AderenciaCard;