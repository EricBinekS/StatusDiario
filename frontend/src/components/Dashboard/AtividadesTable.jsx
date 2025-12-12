import React from 'react';
import { MapPin, Clock, Calendar, Activity } from 'lucide-react';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { getStatusColor } from '../../utils/formatters';

const AtividadesTable = ({ data = [] }) => {
  if (data.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white">
        Nenhum registro encontrado para os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Gerência / Ativo</th>
            <th className="px-6 py-4">Atividade</th>
            <th className="px-6 py-4">Programação</th>
            <th className="px-6 py-4">Realizado</th>
            <th className="px-6 py-4">Local</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {data.map((row) => (
            <tr key={row.row_hash} className="hover:bg-blue-50/50 transition-colors group">
              {/* Status */}
              <td className="px-6 py-4 align-top">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(row.status || row.operational_status)}`}>
                  {row.status || row.operational_status || 'N/A'}
                </span>
              </td>

              {/* Gerência e Ativo */}
              <td className="px-6 py-4 align-top">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-sm">{row.gerencia_da_via}</span>
                  <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Activity size={12} />
                    {row.ativo}
                  </span>
                </div>
              </td>

              {/* Atividade */}
              <td className="px-6 py-4 align-top">
                <div className="text-sm text-gray-700 font-medium">
                  {row.atividade}
                </div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                  {row.tipo}
                </div>
              </td>

              {/* Programação */}
              <td className="px-6 py-4 align-top">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar size={12} className="text-blue-400" />
                    <span>{formatDate(row.data)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 font-mono bg-gray-50 px-1 rounded w-max">
                    <Clock size={12} className="text-orange-400" />
                    <span>{formatTime(row.inicio_prog)} - {formatTime(row.fim_prog)}</span>
                  </div>
                </div>
              </td>

              {/* Realizado */}
              <td className="px-6 py-4 align-top">
                 <div className="flex items-center gap-2 text-xs text-gray-600 font-mono bg-gray-50 px-1 rounded w-max">
                    <Clock size={12} className={row.inicio_real ? "text-green-500" : "text-gray-300"} />
                    <span>
                      {row.inicio_real ? formatTime(row.inicio_real) : '--:--'} - {row.fim_real ? formatTime(row.fim_real) : '--:--'}
                    </span>
                  </div>
              </td>

              {/* Local */}
              <td className="px-6 py-4 align-top">
                <div className="flex items-start gap-1 text-xs text-gray-500 max-w-[150px]">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-red-400" />
                  <span className="truncate" title={row.local_prog}>{row.local_prog || '-'}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AtividadesTable;