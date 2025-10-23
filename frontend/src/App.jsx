import { useState, useEffect, useMemo, useRef } from 'react';
import './index.css';

// Função para calcular tempo real (inalterada)
function calculateRealTime(startISO, endISO, now) {
    if (endISO) {
        const start = new Date(startISO);
        const end = new Date(endISO);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return "00:00";
        let effectiveEnd = end;
        if (end < start) {
            effectiveEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);
        }
        const diffMs = effectiveEnd - start;
        if (diffMs < 0 || diffMs > (36 * 60 * 60 * 1000)) {
             return "--:--";
        }
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    if (startISO) {
        const start = new Date(startISO);
        if (isNaN(start.getTime())) return "";
        const diffMs = now - start;
        if (diffMs < 0 || diffMs > (36 * 60 * 60 * 1000)) {
             return "--:--";
        }
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return <span className="timer-running">{`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`}</span>;
    }
    return "--:--";
}

// Função para identificar linhas atualizadas (USA NOMES CORRIGIDOS)
function findUpdatedRows(oldData, newData) {
    const updated = new Set();
    const oldDataMap = new Map(
        oldData.map(row => [`${row.ativo}-${row.atividade}-${row.data}`, JSON.stringify(row)]) // Usa snake_case
    );
    newData.forEach(newRow => {
        const key = `${newRow.ativo}-${newRow.atividade}-${newRow.data}`; // Usa snake_case
        const newSignature = JSON.stringify(newRow);
        const oldSignature = oldDataMap.get(key);
        if (!oldSignature || oldSignature !== newSignature) {
            updated.add(key);
        }
    });
    return updated;
}

// Função de status (USA NOMES CORRIGIDOS)
function calculateStatusDisplay(row) {
    const statusText = row.status || ''; // Usa snake_case
    const rawDate = row.data; // Usa snake_case
    const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' }) : 'N/A';

    let colorClass = 'status-gray';
    const lowerStatus = statusText.toLowerCase();

    if (lowerStatus.includes('concluído') || lowerStatus.includes('concluido')) colorClass = 'status-green';
    else if (lowerStatus.includes('andamento')) colorClass = 'status-yellow';
    else if (lowerStatus.includes('programado')) colorClass = 'status-gray';
    else if (lowerStatus.includes('cancelado')) colorClass = 'status-red';

    return {
        date: formattedDate,
        colorClass: colorClass,
        tooltip: statusText || 'Status não definido'
    };
}


function App() {
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());
    const [updatedRows, setUpdatedRows] = useState(new Set());
    const previousDataRef = useRef([]);
    const [filters, setFilters] = useState({ data: '', gerencia: '', trecho: '', sub: '', ativo: '', atividade: '', tipo: '' });
    // Define a chave de ordenação inicial com o nome snake_case correto
    const [sortConfig, setSortConfig] = useState({ key: 'inicio_real', direction: 'ascending' });
    const [showDesl, setShowDesl] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const url = `${import.meta.env.VITE_API_URL}/api/atividades`;
                const response = await fetch(url);
                if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
                const jsonData = await response.json();
                // console.log("Dados recebidos da API:", jsonData[0]); // Linha de debug (opcional)
                if (previousDataRef.current.length > 0) {
                    const changes = findUpdatedRows(previousDataRef.current, jsonData);
                    if (changes.size > 0) {
                        setUpdatedRows(changes);
                        setTimeout(() => setUpdatedRows(new Set()), 2000);
                    }
                }
                setRawData(jsonData);
                previousDataRef.current = jsonData;
            } catch (error) {
                console.error("Erro ao buscar os dados:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
        const timerNowId = setInterval(() => setNow(new Date()), 1000);
        const timerFetchId = setInterval(fetchData, 300000);

        return () => {
            clearInterval(timerNowId);
            clearInterval(timerFetchId);
        };
    }, []);

    const getUniqueOptions = (data, key) => {
        if (!Array.isArray(data)) return [];
        const options = new Set();
        data.forEach(row => {
            const value = row[key];
            if (value && value !== '-' && value !== '0') {
                options.add(String(value).trim());
            }
        });
        return Array.from(options).sort((a, b) => String(a).localeCompare(String(b)));
    };

    // Usa nomes snake_case para buscar opções
    const gerenciaOptions = useMemo(() => getUniqueOptions(rawData, 'gerência_da_via'), [rawData]);
    const trechoOptions = useMemo(() => {
        let filteredData = rawData;
        if (filters.gerencia) { filteredData = rawData.filter(row => row.gerência_da_via === filters.gerencia); }
        return getUniqueOptions(filteredData, 'coordenação_da_via');
    }, [rawData, filters.gerencia]);
    const subOptions = useMemo(() => {
        let filteredData = rawData;
        if (filters.gerencia) { filteredData = filteredData.filter(row => row.gerência_da_via === filters.gerencia); }
        if (filters.trecho) { filteredData = filteredData.filter(row => row.coordenação_da_via === filters.trecho); }
        return getUniqueOptions(filteredData, 'sub');
    }, [rawData, filters.gerencia, filters.trecho]);
    const atividadeOptions = useMemo(() => {
        let filteredData = rawData;
        if (filters.gerencia) filteredData = filteredData.filter(row => row.gerência_da_via === filters.gerencia);
        if (filters.trecho) filteredData = filteredData.filter(row => row.coordenação_da_via === filters.trecho);
        if (filters.sub) filteredData = filteredData.filter(row => String(row.sub) === filters.sub);
        return getUniqueOptions(filteredData, 'atividade');
    }, [rawData, filters.gerencia, filters.trecho, filters.sub]);
    const tipoOptions = useMemo(() => {
        let filteredData = rawData;
        if (filters.gerencia) filteredData = filteredData.filter(row => row.gerência_da_via === filters.gerencia);
        if (filters.trecho) filteredData = filteredData.filter(row => row.coordenação_da_via === filters.trecho);
        if (filters.sub) filteredData = filteredData.filter(row => String(row.sub) === filters.sub);
        return getUniqueOptions(filteredData, 'programar_para_d_1');
    }, [rawData, filters.gerencia, filters.trecho, filters.sub]);

    const handleFilterChange = (filterName, value) => {
        const newFilters = { ...filters, [filterName]: value };
        if (filterName === 'gerencia') { newFilters.trecho = ''; newFilters.sub = ''; newFilters.atividade = ''; newFilters.tipo = ''; }
        if (filterName === 'trecho') { newFilters.sub = ''; newFilters.atividade = ''; newFilters.tipo = ''; }
        setFilters(newFilters);
    };

    const sortedAndFilteredData = useMemo(() => {
        if (!Array.isArray(rawData)) return [];
        let filterableData = [...rawData];
        if (!showDesl) {
            filterableData = filterableData.filter(row => row.tempo_real_override !== 'DESL');
        }
        filterableData = filterableData.filter(row => {
            // Usa nomes snake_case
            if (filters.data && row.data !== filters.data) return false;
            if (filters.gerencia && row.gerência_da_via !== filters.gerencia) return false;
            if (filters.trecho && row.coordenação_da_via !== filters.trecho) return false;
            if (filters.sub && String(row.sub) !== filters.sub) return false;
            if (filters.ativo && !String(row.ativo || '').toLowerCase().includes(filters.ativo.toLowerCase())) return false;
            if (filters.atividade && row.atividade !== filters.atividade) return false;
            if (filters.tipo && row.programar_para_d_1 !== filters.tipo) return false;
            return true;
        });
        if (sortConfig.key) {
            const sortKey = sortConfig.key; // Chave já está correta (snake_case)
            filterableData.sort((a, b) => {
                const valA = a[sortKey]; const valB = b[sortKey];
                if (valA == null && valB == null) return 0;
                if (valA == null) return sortConfig.direction === 'ascending' ? 1 : -1;
                if (valB == null) return sortConfig.direction === 'ascending' ? -1 : 1;
                // Comparação numérica ou string
                const numA = parseFloat(valA); const numB = parseFloat(valB);
                if (!isNaN(numA) && !isNaN(numB)) {
                     if (numA < numB) return sortConfig.direction === 'ascending' ? -1 : 1;
                     if (numA > numB) return sortConfig.direction === 'ascending' ? 1 : -1;
                     return 0;
                } else {
                     return sortConfig.direction === 'ascending' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
                }
            });
        }
        return filterableData;
    }, [rawData, filters, sortConfig, showDesl]);

    // Função requestSort usa a chave como string (já deve ser snake_case)
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortDirectionClass = (key) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'ascending' ? 'sort-asc' : 'sort-desc';
    };

    return (
        <>
            <header>
                <h1>PAINEL PCM</h1>
                <img src="/rumo-logo.svg" alt="Rumo Logo" className="logo" />
            </header>
            <main>
                <section className="filters">
                    {/* Filtros mantidos */}
                    <div className="filter-item"><label htmlFor="data">Data:</label><input type="date" id="data" value={filters.data} onChange={(e) => handleFilterChange('data', e.target.value)} /></div>
                    <div className="filter-item"><label htmlFor="gerencia">Gerência:</label><select id="gerencia" value={filters.gerencia} onChange={(e) => handleFilterChange('gerencia', e.target.value)}><option value="">Todas</option>{gerenciaOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
                    <div className="filter-item"><label htmlFor="trecho">Trecho:</label><select id="trecho" value={filters.trecho} onChange={(e) => handleFilterChange('trecho', e.target.value)}><option value="">Todos</option>{trechoOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
                    <div className="filter-item"><label htmlFor="sub">Sub:</label><select id="sub" value={filters.sub} onChange={(e) => handleFilterChange('sub', e.target.value)}><option value="">Todos</option>{subOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
                    <div className="filter-item"><label htmlFor="ativo">Ativo:</label><input type="text" id="ativo" value={filters.ativo} onChange={(e) => handleFilterChange('ativo', e.target.value)} /></div>
                    <div className="filter-item"><label htmlFor="atividade">Atividade:</label><select id="atividade" value={filters.atividade} onChange={(e) => handleFilterChange('atividade', e.target.value)}><option value="">Todas</option>{atividadeOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
                    <div className="filter-item"><label htmlFor="tipo">Tipo:</label><select id="tipo" value={filters.tipo} onChange={(e) => handleFilterChange('tipo', e.target.value)}><option value="">Todos</option>{tipoOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
                    <div className="filter-item">
                        <label>Especiais:</label>
                        <div className="checkbox-container">
                            <input type="checkbox" id="show-desl" checked={showDesl} onChange={(e) => setShowDesl(e.target.checked)} />
                        </div>
                    </div>
                </section>
                <section className="tabela-wrapper">
                    {loading ? (<p>Carregando dados...</p>) : (
                        <table className="grid-table">
                            <thead>
                                <tr>
                                     {/* Cabeçalhos CORRIGIDOS para usar snake_case na ordenação */}
                                    <th className={`col-status ${getSortDirectionClass('data')}`} onClick={() => requestSort('data')}><strong>Data / Status</strong></th>
                                    <th className={`col-identificador ${getSortDirectionClass('ativo')}`} onClick={() => requestSort('ativo')}><strong>Identificador</strong><br /><span>Ativo &nbsp;&nbsp;&nbsp;&nbsp; Atividade</span></th>
                                    <th className={`col-inicio ${getSortDirectionClass('inicio_real')}`} onClick={() => requestSort('inicio_real')}><strong>Inicio</strong><br /><span>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span></th>
                                    <th className={`col-tempo ${getSortDirectionClass('tempo_prog')}`} onClick={() => requestSort('tempo_prog')}><strong>Tempo</strong><br /><span>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span></th>
                                    <th className={`col-local ${getSortDirectionClass('local_prog')}`} onClick={() => requestSort('local_prog')}><strong>Local</strong><br /><span>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span></th>
                                    <th className={`col-quantidade ${getSortDirectionClass('quantidade_prog')}`} onClick={() => requestSort('quantidade_prog')}><strong>Quantidade</strong><br /><span>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span></th>
                                    <th className="col-detalhamento">Detalhamento</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAndFilteredData.map((row, index) => {
                                    const rowKey = `${row.ativo}-${row.atividade}-${row.data}`;
                                    const isUpdated = updatedRows.has(rowKey);
                                    const statusDisplay = calculateStatusDisplay(row);
                                    return (
                                        <tr key={index} className={isUpdated ? 'linha-atualizada' : ''}>
                                            {/* --- CÉLULA DATA/STATUS CORRIGIDA --- */}
                                            <td data-label="Data / Status">
                                                <div className="cell-status-container">
                                                    <span className="status-date">{statusDisplay.date}</span>
                                                    <div title={statusDisplay.tooltip}>
                                                        {/* Ícone usa a classe de cor */}
                                                        <div className={`status-icon ${statusDisplay.colorClass}`}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* --- DEMAIS CÉLULAS (usam snake_case) --- */}
                                            <td data-label="Identificador"><div className="cell-prog-real"><span><strong>{row.ativo || 'N/A'}</strong></span><span>{row.atividade || 'N/A'}</span></div></td>
                                            <td data-label="Início"><div className="cell-prog-real"><span><strong>{row.inicio_prog || '--:--'}</strong></span><span><strong>{row.inicio_real || '--:--'}</strong></span></div></td>
                                            {/* --- CÉLULA TEMPO REAL CORRIGIDA --- */}
                                            <td data-label="Tempo">
                                                <div className="cell-prog-real">
                                                    <span><strong>{row.tempo_prog || '--:--'}</strong></span>
                                                    <span><strong>
                                                        {row.tempo_real_override ? row.tempo_real_override
                                                          : (calculateRealTime(row.timer_start_timestamp, row.timer_end_timestamp, now) || '--:--')
                                                        }
                                                    </strong></span>
                                                </div>
                                            </td>
                                            <td data-label="Local"><div className="cell-prog-real"><span><strong>{row.local_prog || 'N/A'}</strong></span><span><strong>{row.local_real || 'N/A'}</strong></span></div></td>
                                            <td data-label="Quantidade"><div className="cell-prog-real"><span><strong>{isNaN(parseFloat(row.quantidade_prog)) ? 0 : row.quantidade_prog}</strong></span><span><strong>{isNaN(parseFloat(row.quantidade_real)) ? 0 : row.quantidade_real}</strong></span></div></td>
                                            <td data-label="Detalhamento" className="cell-detalhamento">{row.detalhamento || ''}</td>
                                        </tr>
                                    );
                                })}
                                {sortedAndFilteredData.length === 0 && !loading && (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Nenhum dado encontrado com os filtros aplicados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </section>
            </main>
        </>
    );
}

export default App;