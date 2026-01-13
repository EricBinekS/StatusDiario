import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { getDerivedStatus, getStatusUI, formatDateShort } from '../../utils/dataUtils';
import LiveTimer from './LiveTimer';
import MobileActivityCard from './MobileActivityCard';

const AtividadesTable = ({ data, searchTerm }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'desc' });

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
        String(i.ativo || '').toLowerCase().includes(lower) || 
        String(i.atividade || '').toLowerCase().includes(lower) || 
        String(i.detalhamento || '').toLowerCase().includes(lower)
      );
    }
    
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (sortConfig.key === 'status') {
            const statusOrder = { 'cancelado': 0, 'nao_iniciado': 1, 'andamento': 2, 'parcial': 3, 'concluido': 4 };
            const sA = getDerivedStatus(a);
            const sB = getDerivedStatus(b);
            const wA = statusOrder[sA] ?? 99;
            const wB = statusOrder[sB] ?? 99;
            return sortConfig.direction === 'asc' ? (wA - wB) : (wB - wA);
        }
        
        const getVal = (obj, key) => obj[key] !== undefined ? obj[key] : null;
        let aVal = getVal(a, sortConfig.key);
        let bVal = getVal(b, sortConfig.key);
        
        if (aVal === null) aVal = -Infinity;
        if (bVal === null) bVal = -Infinity;
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [data, sortConfig, searchTerm]);

  // Cores das bolinhas (Estilo Original)
  const getDotColor = (row) => {
      const st = getDerivedStatus(row);
      switch (st) {
        case 'concluido': return 'bg-[#28a745] ring-[#28a745]'; 
        case 'cancelado': return 'bg-[#ef4444] ring-[#ef4444]'; 
        case 'parcial': return 'bg-[#fd7e14] ring-[#fd7e14]';   
        case 'andamento': return 'bg-[#ffc107] ring-[#ffc107]'; 
        case 'nao_iniciado': return 'bg-[#6c757d] ring-[#6c757d]'; 
        default: return 'bg-[#6c757d] ring-[#6c757d]';
      }
  };

  const SortableHeader = ({ label, sortKey, width, colorClass, borderRight = true }) => (
    <th onClick={() => handleSort(sortKey)} className={`${width} ${colorClass} dark:opacity-90 py-3 px-1 ${borderRight ? 'border-r border-[#e5e7eb] dark:border-slate-600' : ''} cursor-pointer group select-none transition-colors hover:brightness-95`}>
      <div className="flex items-center justify-center gap-1 text-[#062e4e] dark:text-slate-900 font-bold"><span className="text-center">{label}</span>{getSortIcon(sortKey)}</div>
    </th>
  );

  return (
    <div className="flex flex-col gap-2">
      {/* DESKTOP */}
      <div className="hidden md:block w-full overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-200 dark:border-slate-700">
        <table className="w-full border-collapse table-fixed min-w-[1000px]">
          <thead>
            <tr className="text-[11px] border-b-2 border-[#d1d5db] dark:border-slate-600">
              <SortableHeader label="Data / Status" sortKey="status" width="w-[8%]" colorClass="bg-[#E6E6FA]" />
              <th className="w-[18%] bg-[#9eb0be] dark:bg-slate-500 py-3 px-1 border-r border-[#e5e7eb] dark:border-slate-600 text-[#062e4e] dark:text-white font-bold">Identificador<br/><span className="text-[9px] font-normal opacity-80">Ativo | Atividade</span></th>
              {/* Note que as chaves de ordenação agora usam underline (_) em vez de ponto (.) */}
              <SortableHeader label={<span>Início<br/><span className="text-[9px] font-normal opacity-80">Prog | Real</span></span>} sortKey="inicio_prog" width="w-[10%]" colorClass="bg-[#8acaba]" />
              <SortableHeader label={<span>Tempo<br/><span className="text-[9px] font-normal opacity-80">Prog | Real</span></span>} sortKey="tempo_real" width="w-[10%]" colorClass="bg-[#a7fa97]" />
              <th className="w-[12%] bg-[#a7fa97] dark:bg-emerald-200/80 py-3 px-1 border-r border-[#e5e7eb] dark:border-slate-600 text-[#062e4e] dark:text-slate-900 font-bold">Local<br/><span className="text-[9px] font-normal opacity-80">Prog | Real</span></th>
              <th className="w-[10%] bg-[#a7fa97] dark:bg-emerald-200/80 py-3 px-1 border-r border-[#e5e7eb] dark:border-slate-600 text-[#062e4e] dark:text-slate-900 font-bold">Quantidade<br/><span className="text-[9px] font-normal opacity-80">Prog | Real</span></th>
              <th className="w-[32%] bg-[#fc9254] dark:bg-orange-300/80 py-3 px-1 text-[#062e4e] dark:text-slate-900 font-bold">Detalhamento</th>
            </tr>
          </thead>
          
          <tbody className="text-[11px] text-[#333] dark:text-slate-300">
            {processedData.length === 0 ? (
                <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400 dark:text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                           <Search size={24} className="opacity-40" />
                           <span className="text-xs font-medium">Nenhuma atividade encontrada com esses filtros.</span>
                        </div>
                    </td>
                </tr>
            ) : (
                processedData.map((row) => {
                  const statusAtual = getDerivedStatus(row);
                  
                  // --- CORREÇÃO DO ERRO ---
                  // Mapeia as chaves planas do backend para variáveis locais
                  // Isso evita o erro "reading 'real' of undefined"
                  const inicioReal = row.inicio_real || '--:--';
                  const inicioProg = row.inicio_prog || '--:--';
                  const tempoReal = row.tempo_real || '--:--';
                  const tempoProg = row.tempo_prog || '--:--';
                  
                  const localReal = row.local_real || '-';
                  const localProg = row.local_prog || '-';
                  
                  const quantReal = row.producao_real || '-';
                  const quantProg = row.producao_prog || '-';

                  const temInicio = inicioReal && inicioReal !== '--:--';
                  const isAndamento = statusAtual === 'andamento';
                  const isBloco = tempoProg === '00:01';
                  const showTimer = isAndamento && temInicio && !isBloco;

                  return (
                  <tr key={row.id} className="border-b border-[#f3f4f6] dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors group">
                    <td className="bg-[#fcfcfd] dark:bg-slate-800 group-hover:bg-gray-50 dark:group-hover:bg-slate-700 py-1.5 px-2 border-r border-[#f3f4f6] dark:border-slate-700 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold tabular-nums tracking-tight dark:text-slate-200">{formatDateShort(row.data)}</span>
                        <span className="text-gray-300 dark:text-slate-600">|</span>
                        <div className={`w-3 h-3 rounded-full shadow-sm ring-1 ring-white dark:ring-slate-800 ${getDotColor(row)}`}></div>
                      </div>
                    </td>
                    
                    <td className="bg-[#fcfcfd] dark:bg-slate-800 group-hover:bg-gray-50 dark:group-hover:bg-slate-700 py-1.5 px-2 border-r border-[#f3f4f6] dark:border-slate-700">
                      <div className="flex flex-col items-center leading-tight">
                        <span className="font-bold text-[#0f172a] dark:text-white">{row.ativo}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-0.5">{row.atividade}</span>
                      </div>
                    </td>
                    
                    <td className="bg-[#fcfcfd] dark:bg-slate-800 group-hover:bg-gray-50 dark:group-hover:bg-slate-700 py-1.5 px-2 border-r border-[#f3f4f6] dark:border-slate-700">
                      <div className="flex justify-center gap-1.5 font-mono font-medium tabular-nums">
                        {/* Usando a variável corrigida */}
                        <span className="text-gray-600 dark:text-gray-400">{inicioProg}</span>
                        <span className="text-gray-300 dark:text-slate-600">|</span>
                        <span className={temInicio ? 'text-gray-700 dark:text-gray-200 font-bold' : 'text-gray-400 dark:text-slate-600'}> 
                          {inicioReal}
                        </span>
                      </div>
                    </td>
                    
                    <td className="bg-[#fcfcfd] dark:bg-slate-800 group-hover:bg-gray-50 dark:group-hover:bg-slate-700 py-1.5 px-2 border-r border-[#f3f4f6] dark:border-slate-700">
                      <div className="flex justify-center items-center h-full">
                        {isBloco ? (
                            <span className="bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 dark:border-slate-600 uppercase tracking-widest select-none">
                                BLOCO
                            </span>
                        ) : (
                            <div className="flex justify-center gap-1.5 font-mono font-medium tabular-nums">
                                <span className="text-gray-600 dark:text-gray-400">{tempoProg}</span>
                                <span className="text-gray-300 dark:text-slate-600">|</span>
                                {showTimer ? (
                                    <LiveTimer 
                                        startTime={inicioReal} 
                                        dateRef={row.data} 
                                        scheduledDuration={tempoProg} 
                                    />
                                ) : (
                                    <span className={`font-bold ${tempoReal === '--:--' ? 'text-gray-400 dark:text-slate-600' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {tempoReal}
                                    </span>
                                )}
                            </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="bg-[#fcfcfd] dark:bg-slate-800 group-hover:bg-gray-50 dark:group-hover:bg-slate-700 py-1.5 px-2 border-r border-[#f3f4f6] dark:border-slate-700">
                      <div className="flex justify-center gap-1.5 text-[10px]">
                        <span className="text-gray-600 dark:text-gray-400">{localProg}</span>
                        <span className="text-gray-300 dark:text-slate-600">|</span>
                        <span className="font-bold text-gray-700 dark:text-gray-200">{localReal}</span>
                      </div>
                    </td>
                    
                    <td className="bg-[#fcfcfd] dark:bg-slate-800 group-hover:bg-gray-50 dark:group-hover:bg-slate-700 py-1.5 px-2 border-r border-[#f3f4f6] dark:border-slate-700">
                      <div className="flex justify-center gap-1.5 font-medium tabular-nums">
                        <span className="text-gray-600 dark:text-gray-400">{quantProg}</span>
                        <span className="text-gray-300 dark:text-slate-600">|</span>
                        <span className="font-bold text-gray-700 dark:text-gray-200">{quantReal}</span>
                      </div>
                    </td>
                    
                    <td 
                      className="bg-[#fffbf7] dark:bg-slate-800/50 group-hover:bg-gray-50 dark:group-hover:bg-slate-700 py-1.5 px-3 text-left leading-snug cursor-help"
                      title={row.detalhamento} 
                    >
                      {row.detalhamento || "—"}
                    </td>
                  </tr>
                )})
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE */}
      <div className="md:hidden flex flex-col gap-3">
        {processedData.length === 0 ? (
             <div className="py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                <div className="flex flex-col items-center gap-2">
                    <Search size={24} className="opacity-40" />
                    <span className="text-xs font-medium">Nenhuma atividade encontrada.</span>
                </div>
            </div>
        ) : (
            processedData.map((row) => (
                <MobileActivityCard key={row.id} row={row} />
            ))
        )}
      </div>
    </div>
  );
};

export default AtividadesTable;