import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';

const AtividadesTable = ({ data, searchTerm }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={10} className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={10} className="text-blue-600 dark:text-blue-400" /> : <ArrowDown size={10} className="text-blue-600 dark:text-blue-400" />;
  };

  const processedData = useMemo(() => {
    let filtered = [...data];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        String(i.ativo).toLowerCase().includes(lower) || 
        String(i.atividade).toLowerCase().includes(lower) || 
        String(i.detalhe).toLowerCase().includes(lower)
      );
    }
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const getVal = (o, p) => p.split('.').reduce((x, y) => (x && x[y] !== undefined) ? x[y] : null, o);
        let aVal = getVal(a, sortConfig.key);
        let bVal = getVal(b, sortConfig.key);
        if (sortConfig.key === 'status') {
          if (aVal === null || aVal === undefined) aVal = -1;
          if (bVal === null || bVal === undefined) bVal = -1;
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [data, sortConfig, searchTerm]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const currentData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusColor = (s) => {
    if (s === 2) return 'bg-[#28a745] ring-[#28a745]'; // Verde
    if (s === 1) return 'bg-[#ffc107] ring-[#ffc107]'; // Amarelo
    if (s === 0) return 'bg-[#dc3545] ring-[#dc3545]'; // Vermelho
    return 'bg-[#6c757d] ring-[#6c757d]';              // Cinza
  };

  const SortableHeader = ({ label, sortKey, width, colorClass, borderRight = true }) => (
    <th onClick={() => handleSort(sortKey)} className={`${width} ${colorClass} dark:opacity-90 py-3 px-1 ${borderRight ? 'border-r border-[#e5e7eb] dark:border-slate-600' : ''} cursor-pointer group select-none transition-colors hover:brightness-95`}>
      <div className="flex items-center justify-center gap-1 text-[#062e4e] dark:text-slate-900 font-bold"><span className="text-center">{label}</span>{getSortIcon(sortKey)}</div>
    </th>
  );

  return (
    <div className="flex flex-col gap-2">
      
      {/* ======================= */}
      {/* VISUALIZAÇÃO DESKTOP   */}
      {/* ======================= */}
      <div className="hidden md:block w-full overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-200 dark:border-slate-700">
        <table className="w-full border-collapse table-fixed min-w-[1000px]">
          <thead>
            <tr className="text-[11px] border-b-2 border-[#d1d5db] dark:border-slate-600">
              <SortableHeader label="Data / Status" sortKey="status" width="w-[8%]" colorClass="bg-[#E6E6FA]" />
              <th className="w-[18%] bg-[#9eb0be] dark:bg-slate-500 py-3 px-1 border-r border-[#e5e7eb] dark:border-slate-600 text-[#062e4e] dark:text-white font-bold">Identificador<br/><span className="text-[9px] font-normal opacity-80">Ativo | Atividade</span></th>
              <SortableHeader label={<span>Início<br/><span className="text-[9px] font-normal opacity-80">Prog | Real</span></span>} sortKey="inicio.prog" width="w-[10%]" colorClass="bg-[#8acaba]" />
              <SortableHeader label={<span>Tempo<br/><span className="text-[9px] font-normal opacity-80">Prog | Real</span></span>} sortKey="tempo.real" width="w-[10%]" colorClass="bg-[#a7fa97]" />
              <th className="w-[12%] bg-[#a7fa97] dark:bg-emerald-200/80 py-3 px-1 border-r border-[#e5e7eb] dark:border-slate-600 text-[#062e4e] dark:text-slate-900 font-bold">Local<br/><span className="text-[9px] font-normal opacity-80">Prog | Real</span></th>
              <th className="w-[10%] bg-[#a7fa97] dark:bg-emerald-200/80 py-3 px-1 border-r border-[#e5e7eb] dark:border-slate-600 text-[#062e4e] dark:text-slate-900 font-bold">Quantidade<br/><span className="text-[9px] font-normal opacity-80">Prog | Real</span></th>
              <th className="w-[32%] bg-[#fc9254] dark:bg-orange-300/80 py-3 px-1 text-[#062e4e] dark:text-slate-900 font-bold">Detalhamento</th>
            </tr>
          </thead>
          <tbody className="text-[11px] text-[#333] dark:text-slate-300">
            {currentData.map((row) => (
              <tr key={row.id} className="border-b border-[#f3f4f6] dark:border-slate-700 hover:bg-blue-50/30 dark:hover:bg-slate-700/50 transition-colors group">
                {/* Data e Status */}
                <td className="bg-[#fcfcfd] dark:bg-slate-800 group-hover:bg-blue-50/30 dark:group-hover:bg-slate-700/50 py-1.5 px-2 border-r border-[#f3f4f6] dark:border-slate-700 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-bold tabular-nums tracking-tight dark:text-slate-200">{row.data}</span>
                    <span className="text-gray-300 dark:text-slate-600">|</span>
                    <div className={`w-3 h-3 rounded-full shadow-sm ring-1 ring-white dark:ring-slate-800 ${getStatusColor(row.status)}`}></div>
                  </div>
                </td>
                
                <td className="bg-[#fcfcfd] dark:bg-slate-800 group-hover:bg-blue-50/30 dark:group-hover:bg-slate-700/50 py-1.5 px-2 border-r border-[#f3f4f6] dark:border-slate-700">
                  <div className="flex flex-col items-center leading-tight">
                    <span className="font-bold text-[#0f172a] dark:text-white">{row.ativo}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-0.5">{row.atividade}</span>
                  </div>
                </td>
                
                <td className="bg-[#fcfcfd] dark:bg-slate-800 group-hover:bg-blue-50/30 dark:group-hover:bg-slate-700/50 py-1.5 px-2 border-r border-[#f3f4f6] dark:border-slate-700">
                  <div className="flex justify-center gap-1.5 font-mono font-medium tabular-nums">
                    <span className="text-gray-600 dark:text-gray-400">{row.inicio.prog}</span>
                    <span className="text-gray-300 dark:text-slate-600">|</span>
                    <span className={row.inicio.real === '--:--' ? 'text-gray-400 dark:text-slate-600' : 'text-gray-700 dark:text-gray-200 font-bold'}> 
                      {row.inicio.real}
                    </span>
                  </div>
                </td>
                
                <td className="bg-[#fcfcfd] dark:bg-slate-800 group-hover:bg-blue-50/30 dark:group-hover:bg-slate-700/50 py-1.5 px-2 border-r border-[#f3f4f6] dark:border-slate-700">
                  <div className="flex justify-center gap-1.5 font-mono font-medium tabular-nums">
                    <span className="text-gray-600 dark:text-gray-400">{row.tempo.prog}</span>
                    <span className="text-gray-300 dark:text-slate-600">|</span>
                    <span className={`font-bold ${row.tempo.real === '--:--' ? 'text-gray-400 dark:text-slate-600' : 'text-gray-700 dark:text-gray-200'}`}>
                      {row.tempo.real}
                    </span>
                  </div>
                </td>
                
                <td className="bg-[#fcfcfd] dark:bg-slate-800 group-hover:bg-blue-50/30 dark:group-hover:bg-slate-700/50 py-1.5 px-2 border-r border-[#f3f4f6] dark:border-slate-700">
                  <div className="flex justify-center gap-1.5 text-[10px]">
                    <span className="text-gray-600 dark:text-gray-400">{row.local.prog}</span>
                    <span className="text-gray-300 dark:text-slate-600">|</span>
                    <span className="font-bold text-gray-700 dark:text-gray-200">{row.local.real}</span>
                  </div>
                </td>
                
                <td className="bg-[#fcfcfd] dark:bg-slate-800 group-hover:bg-blue-50/30 dark:group-hover:bg-slate-700/50 py-1.5 px-2 border-r border-[#f3f4f6] dark:border-slate-700">
                  <div className="flex justify-center gap-1.5 font-medium tabular-nums">
                    <span className="text-gray-600 dark:text-gray-400">{row.quant.prog}</span>
                    <span className="text-gray-300 dark:text-slate-600">|</span>
                    <span className="font-bold text-gray-700 dark:text-gray-200">{row.quant.real}</span>
                  </div>
                </td>
                
                <td className="bg-[#fffbf7] dark:bg-slate-800/50 group-hover:bg-orange-50/30 dark:group-hover:bg-slate-700/50 py-1.5 px-3 text-left leading-snug">
                  {row.detalhe}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ======================= */}
      {/* VISUALIZAÇÃO MOBILE   */}
      {/* ======================= */}
      <div className="md:hidden flex flex-col gap-3">
        {currentData.map((row) => (
          <div key={row.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            {/* Cabeçalho do Card */}
            <div className="flex justify-between items-start mb-3 border-b border-gray-100 dark:border-slate-700 pb-2">
                <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Atividade</span>
                    <div className="font-bold text-slate-800 dark:text-white text-sm">{row.ativo}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{row.atividade}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(row.status)}`}></div>
                    <span className="text-[10px] font-mono text-gray-400">{row.data}</span>
                </div>
            </div>

            {/* Grid de Informações */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <MobileInfoBlock label="Início (Prog | Real)" value={
                    <div className="flex gap-1.5 font-mono text-xs">
                         <span className="text-gray-500">{row.inicio.prog}</span>
                         <span className="text-gray-300">|</span>
                         <span className={row.inicio.real === '--:--' ? 'text-gray-400' : 'text-slate-800 dark:text-white font-bold'}>{row.inicio.real}</span>
                    </div>
                } />
                 <MobileInfoBlock label="Tempo (Prog | Real)" value={
                    <div className="flex gap-1.5 font-mono text-xs">
                         <span className="text-gray-500">{row.tempo.prog}</span>
                         <span className="text-gray-300">|</span>
                         <span className={`font-bold ${row.tempo.real === '--:--' ? 'text-gray-400' : 'text-slate-800 dark:text-white'}`}>{row.tempo.real}</span>
                    </div>
                } />
                <MobileInfoBlock label="Local" value={
                     <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{row.local.real !== '-' ? row.local.real : row.local.prog}</div>
                } />
                 <MobileInfoBlock label="Quantidade" value={
                     <div className="text-xs text-gray-600 dark:text-gray-300">{row.quant.real !== '0' ? row.quant.real : row.quant.prog}</div>
                } />
            </div>

            {/* Detalhe Footer */}
            <div className="bg-gray-50 dark:bg-slate-700/50 p-2 rounded-lg border border-gray-100 dark:border-slate-700">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Detalhamento</span>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{row.detalhe || 'Sem detalhes.'}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Paginação (Comum para ambos) */}
      <div className="flex justify-between items-center px-2 py-2">
        <span className="text-[10px] text-gray-400 font-medium">Mostrando {currentData.length} de {processedData.length}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 dark:text-white disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 px-2">{currentPage} / {totalPages || 1}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 dark:text-white disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
};

const MobileInfoBlock = ({ label, value }) => (
    <div>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">{label}</span>
        {value}
    </div>
);

export default AtividadesTable;