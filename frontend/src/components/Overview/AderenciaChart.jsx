import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from 'recharts';

const AderenciaChart = ({ data, color }) => {
  const isBlue = color === 'blue';
  const colorProg = isBlue ? '#dbeafe' : '#f3e8ff';
  const colorReal = isBlue ? '#2563eb' : '#9333ea';

  if (!data || data.length === 0) return <div className="h-full w-full flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded">Sem dados</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} />
        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
        <Bar dataKey="prog" name="Prog" fill={colorProg} radius={[2, 2, 0, 0]} barSize={12} />
        <Bar dataKey="real" name="Real" fill={colorReal} radius={[2, 2, 0, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
};
export default AderenciaChart;