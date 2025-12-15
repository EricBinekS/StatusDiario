import React from 'react';
import { MapPin, Activity } from 'lucide-react';
import { formatTime } from '../../utils/dateUtils';

const AtividadesTable = ({ data = [] }) => {
  if (data.length === 0) {
    return <div className="p-8 text-center text-slate-500 text-sm">Nenhum dado encontrado.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <th className="px-3 py-2 w-24">Status</th>
            <th className="px-3 py-2">Gerência / Ativo</th>
            <th className="px-3 py-2">Atividade</th>
            <th className="px-3 py-2 w-32 text-center">Início Prog.</th>
            <th className="px-3 py-2 w-32 text-center">Início Real</th>
            <th className="px-3 py-2 w-32 text-center">Fim Real</th>
            <th className="px-3 py-2">Local</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((row) => (
            <tr key={row.row_hash} className="hover:bg-blue-50/50 transition-colors text-xs text-slate-700">
              
              {/* Status (Badge Compacto) */}
              <td className="px-3 py-2 whitespace-nowrap">
                <StatusBadge status={row.status || row.operational_status} />
              </td>

              {/* Gerência */}
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="font-bold text-slate-800">{row.gerencia_da_via}</div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                   <Activity size={10} /> {row.ativo}
                </div>
              </td>

              {/* Atividade */}
              <td className="px-3 py-2">
                <div className="font-medium">{row.atividade}</div>
                <div className="text-[10px] text-slate-400 uppercase">{row.tipo}</div>
              </td>

              {/* Horários */}
              <td className="px-3 py-2 text-center font-mono text-slate-600">
                {formatTime(row.inicio_prog)}
              </td>
              <td className="px-3 py-2 text-center font-mono text-blue-700 font-bold">
                {row.inicio_real ? formatTime(row.inicio_real) : '-'}
              </td>
              <td className="px-3 py-2 text-center font-mono text-green-700 font-bold">
                {row.fim_real ? formatTime(row.fim_real) : '-'}
              </td>

              {/* Local */}
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-center gap-1 text-slate-500">
                  <MapPin size={10} />
                  {row.local_prog || '-'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const s = String(status).toUpperCase();
  let classes = "bg-slate-100 text-slate-600 border-slate-200";
  
  if (s === 'CONCLUIDO' || s === 'CONCLUÍDO') classes = "bg-green-100 text-green-700 border-green-200";
  else if (s === 'EM ANDAMENTO') classes = "bg-blue-100 text-blue-700 border-blue-200";
  else if (s === 'PROGRAMADO') classes = "bg-yellow-50 text-yellow-700 border-yellow-200";
  else if (s === 'CANCELADO') classes = "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${classes}`}>
      {status || 'N/A'}
    </span>
  );
};

export default AtividadesTable;