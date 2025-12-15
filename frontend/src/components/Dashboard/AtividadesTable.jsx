import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';

const AtividadesTable = ({ data, searchTerm }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={10} className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={10} className="text-blue-600" /> : <ArrowDown size={10} className="text-blue-600" />;
  };

  const processedData = useMemo(() => {
    let filtered = [...data];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(i => String(i.ativo).toLowerCase().includes(lower) || String(i.atividade).toLowerCase().includes(lower) || String(i.detalhe).toLowerCase().includes(lower));
    }
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const getVal = (o, p) => p.split('.').reduce((x, y) => x[y], o);
        const aVal = getVal(a, sortConfig.key);
        const bVal = getVal(b, sortConfig.key);
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [data, sortConfig, searchTerm]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const currentData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusColor = (s) => (s === 2 ? 'bg-[#28a745]' : s === 1 ? 'bg-[#ffc107]' : s === 0 ? 'bg-[#dc3545]' : 'bg-[#6c757d]');

  const SortableHeader = ({ label, sortKey, width, colorClass, borderRight = true }) => (
    <th onClick={() => handleSort(sortKey)} className={`${width} ${colorClass} py-3 px-1 ${borderRight ? 'border-r border-[#e5e7eb]' : ''} cursor-pointer group select-none transition-colors hover:brightness-95`}>
      <div className="flex items-center justify-center gap-1"><span className="text-center">{label}</span>{getSortIcon(sortKey)}</div>
    </th>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full overflow-x-auto bg-white rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-200">
        <table className="w-full border-collapse table-fixed min-w-[1000px]">
          <thead>
            <tr className="text-[11px] text-[#062e4e] border-b-2 border-[#d1d5db]">
              <SortableHeader label="Data / Status" sortKey="data" width="w-[8%]" colorClass="bg-[#E6E6FA]" />
              <th className="w-[18%] bg-[#9eb0be] py-3 px-1 border-r border-[#e5e7eb]">Identificador<br/><span className="text-[9px] font-normal opacity-80">Ativo | Atividade</span></th>
              <SortableHeader label={<span>Início<br/><span className="text-[9px] font-normal opacity-80">Prog | Real</span></span>} sortKey="inicio.prog" width="w-[10%]" colorClass="bg-[#8acaba]" />
              <SortableHeader label={<span>Tempo<br/><span className="text-[9px] font-normal opacity-80">Prog | Real</span></span>} sortKey="tempo.real" width="w-[10%]" colorClass="bg-[#a7fa97]" />
              <th className="w-[12%] bg-[#a7fa97] py-3 px-1 border-r border-[#e5e7eb]">Local<br/><span className="text-[9px] font-normal opacity-80">Prog | Real</span></th>
              <th className="w-[10%] bg-[#a7fa97] py-3 px-1 border-r border-[#e5e7eb]">Quantidade<br/><span className="text-[9px] font-normal opacity-80">Prog | Real</span></th>
              <th className="w-[32%] bg-[#fc9254] py-3 px-1">Detalhamento</th>
            </tr>
          </thead>
          <tbody className="text-[11px] text-[#333]">
            {currentData.map((row) => (
              <tr key={row.id} className="border-b border-[#f3f4f6] hover:bg-blue-50/30 transition-colors group">
                <td className="bg-[#fcfcfd] group-hover:bg-blue-50/30 py-1.5 px-2 border-r border-[#f3f4f6] text-center">
                  <div className="flex items-center justify-center gap-2"><span className="font-bold tabular-nums tracking-tight">{row.data}</span><span className="text-gray-300">|</span><div className={`w-3 h-3 rounded-full shadow-sm ring-1 ring-white ${getStatusColor(row.status)}`}></div></div>
                </td>
                <td className="bg-[#fcfcfd] group-hover:bg-blue-50/30 py-1.5 px-2 border-r border-[#f3f4f6]">
                  <div className="flex flex-col items-center leading-tight"><span className="font-bold text-[#0f172a]">{row.ativo}</span><span className="text-[10px] text-gray-500 text-center mt-0.5">{row.atividade}</span></div>
                </td>
                <td className="bg-[#fcfcfd] group-hover:bg-blue-50/30 py-1.5 px-2 border-r border-[#f3f4f6]">
                  <div className="flex justify-center gap-1.5 font-mono font-medium tabular-nums"><span>{row.inicio.prog}</span><span className="text-gray-300">|</span><span className={row.inicio.real === '--:--' ? 'text-gray-400' : 'text-blue-800 font-bold'}>{row.inicio.real}</span></div>
                </td>
                <td className="bg-[#fcfcfd] group-hover:bg-blue-50/30 py-1.5 px-2 border-r border-[#f3f4f6]">
                  <div className="flex justify-center gap-1.5 font-mono font-medium tabular-nums"><span>{row.tempo.prog}</span><span className="text-gray-300">|</span><span className={`${row.tempo.isTimer ? 'text-red-600 animate-pulse font-bold' : 'text-green-700'}`}>{row.tempo.real}</span></div>
                </td>
                <td className="bg-[#fcfcfd] group-hover:bg-blue-50/30 py-1.5 px-2 border-r border-[#f3f4f6]">
                  <div className="flex justify-center gap-1.5 text-[10px]"><span>{row.local.prog}</span><span className="text-gray-300">|</span><span className="font-bold text-gray-700">{row.local.real}</span></div>
                </td>
                <td className="bg-[#fcfcfd] group-hover:bg-blue-50/30 py-1.5 px-2 border-r border-[#f3f4f6]">
                  <div className="flex justify-center gap-1.5 font-medium tabular-nums"><span>{row.quant.prog}</span><span className="text-gray-300">|</span><span className="font-bold text-gray-700">{row.quant.real}</span></div>
                </td>
                <td className="bg-[#fffbf7] group-hover:bg-orange-50/30 py-1.5 px-3 text-left leading-snug">{row.detalhe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center px-2">
        <span className="text-[10px] text-gray-400 font-medium">Mostrando {currentData.length} de {processedData.length} registros</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-xs font-bold text-gray-600 px-2">{currentPage} / {totalPages || 1}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
};
export default AtividadesTable;