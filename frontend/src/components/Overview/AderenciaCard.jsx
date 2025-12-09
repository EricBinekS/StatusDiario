import React from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const AderenciaCard = ({ data, isOpen, onClick }) => {
  
  const COLORS = {
    green: '#28a745',
    yellow: '#ffc107',
    red: '#dc3545',
    gray: '#d9d9d9',
    text: '#062e4e'
  };

  const getColor = (percentual) => {
    if (percentual > 80) return { text: 'text-[#28a745]', fill: COLORS.green, border: 'border-l-[#28a745]' };
    if (percentual >= 70) return { text: 'text-[#ffc107]', fill: COLORS.yellow, border: 'border-l-[#ffc107]' };
    return { text: 'text-[#dc3545]', fill: COLORS.red, border: 'border-l-[#dc3545]' };
  };

  const mainStatusColor = getColor(data.types.contrato.percentual).border;

  const TypeSection = ({ title, typeData }) => {
    const color = getColor(typeData.percentual);
    
    return (
      <div className="mb-6 last:mb-0">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wide border-b border-gray-100 pb-1 w-full" style={{ color: COLORS.text }}>
            {title}
          </h4>
        </div>
        
        <div className="grid grid-cols-4 gap-2 mb-4 text-center">
            <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                <span className="block text-[9px] text-gray-400 uppercase font-bold">Int. Prog</span>
                <span className="font-bold text-sm text-gray-700">{typeData.kpis.prog_int}</span>
            </div>
            <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                <span className="block text-[9px] text-gray-400 uppercase font-bold">Int. Real</span>
                <span className="font-bold text-sm text-gray-700">{typeData.kpis.real_int}</span>
            </div>
            <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                <span className="block text-[9px] text-gray-400 uppercase font-bold">Hs Prog</span>
                <span className="font-bold text-sm text-gray-700">{typeData.kpis.prog_h}h</span>
            </div>
            <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                <span className="block text-[9px] text-gray-400 uppercase font-bold">Hs Real</span>
                <span className={`font-bold text-sm ${color.text}`.replace('text-', 'text-')}>{typeData.kpis.real_h}h</span>
            </div>
        </div>

        {/* CORREÇÃO AQUI: Renderização Condicional do Gráfico */}
        {isOpen && (
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData.chartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '4px', border: '1px solid #e9e9e9', fontSize: '12px'}} />
                <Bar dataKey="prog" name="Programado" fill={COLORS.gray} radius={[2, 2, 0, 0]} barSize={12} />
                <Bar dataKey="real" name="Realizado" fill={color.fill} radius={[2, 2, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer transition-all duration-300
        ${mainStatusColor} border-l-[6px]
        ${isOpen ? 'ring-2 ring-blue-500 ring-opacity-50 shadow-md col-span-1 md:col-span-2 lg:col-span-3' : 'hover:shadow-md col-span-1'}
      `}
    >
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h3 className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-1">{data.title}</h3>
            
            <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Contrato:</span>
                    <span className={`text-xl font-bold ${getColor(data.types.contrato.percentual).text}`}>
                        {data.types.contrato.percentual}%
                    </span>
                </div>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <div className="flex items-baseline gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Oportunidade:</span>
                    <span className={`text-xl font-bold ${getColor(data.types.oportunidade.percentual).text}`}>
                        {data.types.oportunidade.percentual}%
                    </span>
                </div>
            </div>
          </div>
          
          <div className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

        <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden min-h-0">
            <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                <TypeSection title="Contrato" typeData={data.types.contrato} />
                <TypeSection title="Oportunidade" typeData={data.types.oportunidade} />
            </div>
            
            <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1 justify-end border-t border-gray-50 pt-2">
                <AlertCircle size={12} />
                <span>Meta de Aderência: 80%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AderenciaCard;