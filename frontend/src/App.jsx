import { useState, useEffect, useMemo, useRef } from 'react';
import './index.css';

const getUniqueOptions = (data, key) => {
    if (!Array.isArray(data)) return [];
    const options = new Set();
    data.forEach(row => {
        const value = row[key];
        if (value != null && value !== '' && value !== '-' && value !== '0') {
            options.add(String(value));
        }
    });
    return Array.from(options).sort((a, b) => String(a).localeCompare(String(b)));
};

function calculateRealTime(row, now) {
    const startISO = row.timer_start_timestamp;
    const endISO = row.timer_end_timestamp;

    if (endISO) {
        const start = new Date(startISO);
        const end = new Date(endISO);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return "00:00";
        let effectiveEnd = end;
        if (end < start) effectiveEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);
        const diffMs = effectiveEnd - start;
        if (diffMs < 0 || diffMs > 36 * 60 * 60 * 1000) return "--:--";
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    if (startISO) {
        const start = new Date(startISO);
        if (isNaN(start.getTime())) return "";
        const diffMs = now - start;
        if (diffMs < 0 || diffMs > 36 * 60 * 60 * 1000) return "--:--";
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return <span className="timer-running">{`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`}</span>;
    }

    return "--:--";
}

function findUpdatedRows(oldData, newData) {
    const updated = new Set();
    const oldDataMap = new Map(oldData.map(row => [row.row_hash, JSON.stringify(row)]));

    newData.forEach(newRow => {
        const key = newRow.row_hash;
        const newSignature = JSON.stringify(newRow);
        const oldSignature = oldDataMap.get(key);
        if (!oldSignature || oldSignature !== newSignature) {
            updated.add(key);
        }
    });

    return updated;
}

function calculateStatusDisplay(row) {
    const statusValue = row.status;
    const rawDate = row.data;
    const formattedDate = rawDate
        ? new Date(rawDate).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' })
        : 'N/A';

    let colorClass = 'status-gray';
    let tooltipText = 'Status não definido';

    if (statusValue === 0 || statusValue === '0') colorClass = 'status-red', tooltipText = 'Status 0 (Vermelho)';
    else if (statusValue === 1 || statusValue === '1') colorClass = 'status-yellow', tooltipText = 'Status 1 (Amarelo)';
    else if (statusValue === 2 || statusValue === '2') colorClass = 'status-green', tooltipText = 'Status 2 (Verde)';
    else if (typeof statusValue === 'string') {
        tooltipText = statusValue;
        const lowerStatus = statusValue.toLowerCase();
        if (lowerStatus.includes('concluído') || lowerStatus.includes('concluido')) colorClass = 'status-green';
        else if (lowerStatus.includes('andamento')) colorClass = 'status-yellow';
        else if (lowerStatus.includes('programado')) colorClass = 'status-gray';
        else if (lowerStatus.includes('cancelado')) colorClass = 'status-red';
    }

    return { date: formattedDate, colorClass, tooltip: tooltipText };
}

function App() {
    const [rawData, setRawData] = useState([]);
    const [updatedRows, setUpdatedRows] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());
    const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'descending' });
    const [showDesl, setShowDesl] = useState(false);
    const [error, setError] = useState(null);
    const previousDataRef = useRef([]);
    const [filters, setFilters] = useState({ data: '', gerencia: '', trecho: '', sub: '', ativo: '', atividade: '', tipo: '' });

    useEffect(() => {
        async function fetchData() {
            try {
                const url = `${import.meta.env.VITE_API_URL}/api/atividades`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const responseData = await response.json();
                const jsonData = responseData.data || [];
                const timestamp = responseData.last_updated;

                if (previousDataRef.current.length > 0) {
                    const changes = findUpdatedRows(previousDataRef.current, jsonData);
                    if (changes.size > 0) {
                        setUpdatedRows(changes);
                        setTimeout(() => setUpdatedRows(new Set()), 2000);
                    }
                }

                setRawData(jsonData);
                previousDataRef.current = jsonData;
                if (timestamp) setLastUpdatedTimestamp(new Date(timestamp));
            } catch (error) {
                console.error("Erro ao buscar os dados:", error);
                setRawData([]);
                setLastUpdatedTimestamp(null);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
        const timerNowId = setInterval(() => setNow(new Date()), 1000);
        const timerFetchId = setInterval(fetchData, 600000);

        return () => {
            clearInterval(timerNowId);
            clearInterval(timerFetchId);
        };
    }, []);

    const gerenciaOptions = useMemo(() => getUniqueOptions(rawData, 'gerência_da_via'), [rawData]);

    const trechoOptions = useMemo(() => {
        let d = rawData;
        if (filters.gerencia) d = d.filter(r => String(r.gerência_da_via) === filters.gerencia);
        return getUniqueOptions(d, 'coordenação_da_via');
    }, [rawData, filters.gerencia]);

    const subOptions = useMemo(() => {
        let d = rawData;
        if (filters.gerencia) d = d.filter(r => String(r.gerência_da_via) === filters.gerencia);
        if (filters.trecho) d = d.filter(r => String(r.coordenação_da_via) === filters.trecho);
        return getUniqueOptions(d, 'sub');
    }, [rawData, filters.gerencia, filters.trecho]);

    const atividadeOptions = useMemo(() => {
        let d = rawData;
        if (filters.gerencia) d = d.filter(r => String(r.gerência_da_via) === filters.gerencia);
        if (filters.trecho) d = d.filter(r => String(r.coordenação_da_via) === filters.trecho);
        if (filters.sub) d = d.filter(r => String(r.sub) === filters.sub);
        return getUniqueOptions(d, 'atividade');
    }, [rawData, filters.gerencia, filters.trecho, filters.sub]);

    const tipoOptions = useMemo(() => {
        let d = rawData;
        if (filters.gerencia) d = d.filter(r => String(r.gerência_da_via) === filters.gerencia);
        if (filters.trecho) d = d.filter(r => String(r.coordenação_da_via) === filters.trecho);
        if (filters.sub) d = d.filter(r => String(r.sub) === filters.sub);
        return getUniqueOptions(d, 'programar_para_d_1');
    }, [rawData, filters.gerencia, filters.trecho, filters.sub]);

    const handleFilterChange = (filterName, value) => {
        const newFilters = { ...filters, [filterName]: value };
        if (filterName === 'gerencia') newFilters.trecho = newFilters.sub = newFilters.atividade = newFilters.tipo = '';
        if (filterName === 'trecho') newFilters.sub = newFilters.atividade = newFilters.tipo = '';
        if (filterName === 'sub') newFilters.atividade = newFilters.tipo = '';
        setFilters(newFilters);
    };

    const sortedAndFilteredData = useMemo(() => {
        if (!Array.isArray(rawData)) return [];
        let filterableData = [...rawData];
        if (!showDesl) filterableData = filterableData.filter(row => row.tempo_real_override !== 'DESL');

        filterableData = filterableData.filter(row => {
            if (filters.data && row.data !== filters.data) return false;
            if (filters.ativo && (!row.ativo || !row.ativo.toLowerCase().includes(filters.ativo.toLowerCase()))) return false;
            if (filters.gerencia && String(row.gerência_da_via) !== filters.gerencia) return false;
            if (filters.trecho && String(row.coordenação_da_via) !== filters.trecho) return false;
            if (filters.sub && String(row.sub) !== filters.sub) return false;
            if (filters.atividade && String(row.atividade) !== filters.atividade) return false;
            if (filters.tipo && String(row.programar_para_d_1) !== filters.tipo) return false;
            return true;
        });

        if (sortConfig.key) {
            const sortKey = sortConfig.key;
            filterableData.sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];
                if (valA == null && valB == null) return 0;
                if (valA == null) return 1;
                if (valB == null) return -1;
                const numA = parseFloat(valA);
                const numB = parseFloat(valB);
                let comparison = 0;
                if (!isNaN(numA) && !isNaN(numB)) comparison = numA - numB;
                else comparison = String(valA).localeCompare(String(valB));
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }

        return filterableData;
    }, [rawData, filters, sortConfig, showDesl]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortDirectionClass = (key) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'ascending' ? 'sort-asc' : 'sort-desc';
    };

    const formatLastUpdated = (timestamp) => {
        if (loading && !timestamp) return 'Carregando...';
        if (!timestamp) return 'N/D';
        try {
            return timestamp.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
        } catch {
            return 'Data inválida';
        }
    };

    return (
        <>
            <header>
                <div className="title-container">
                    <h1>PAINEL INTERVALOS - PCM</h1>
                    <p className="last-updated">
                        Última atualização: {formatLastUpdated(lastUpdatedTimestamp)}
                    </p>
                </div>
                <img src="/rumo-logo.svg" alt="Rumo Logo" className="logo" />
            </header>

            <main>
                <section className="filters">
                    <div className="filter-item">
                        <label htmlFor="data">Data:</label>
                        <input type="date" id="data" value={filters.data} onChange={(e) => handleFilterChange('data', e.target.value)} />
                    </div>

                    <div className="filter-item">
                        <label htmlFor="gerencia">Gerência:</label>
                        <select id="gerencia" value={filters.gerencia} onChange={(e) => handleFilterChange('gerencia', e.target.value)}>
                            <option value="">Todas</option>
                            {gerenciaOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="trecho">Trecho:</label>
                        <select id="trecho" value={filters.trecho} onChange={(e) => handleFilterChange('trecho', e.target.value)}>
                            <option value="">Todos</option>
                            {trechoOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="sub">Sub:</label>
                        <select id="sub" value={filters.sub} onChange={(e) => handleFilterChange('sub', e.target.value)}>
                            <option value="">Todos</option>
                            {subOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="ativo">Ativo:</label>
                        <input type="text" id="ativo" value={filters.ativo} onChange={(e) => handleFilterChange('ativo', e.target.value)} />
                    </div>

                    <div className="filter-item">
                        <label htmlFor="atividade">Atividade:</label>
                        <select id="atividade" value={filters.atividade} onChange={(e) => handleFilterChange('atividade', e.target.value)}>
                            <option value="">Todas</option>
                            {atividadeOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="tipo">Tipo:</label>
                        <select id="tipo" value={filters.tipo} onChange={(e) => handleFilterChange('tipo', e.target.value)}>
                            <option value="">Todos</option>
                            {tipoOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label>Especiais:</label>
                        <div className="checkbox-container">
                            <input type="checkbox" id="show-desl" checked={showDesl} onChange={(e) => setShowDesl(e.target.checked)} />
                            <label htmlFor="show-desl">Mostrar DESL</label>
                        </div>
                    </div>
                </section>

                <section className="tabela-wrapper">
                    {loading && <p className="loading-message">Carregando dados...</p>}
                    {!loading && rawData.length === 0 && <p className="loading-message">Nenhum dado disponível.</p>}

                    {!loading && rawData.length > 0 && (
                        <table className="grid-table">
                            <thead>
                                <tr>
                                    <th className={`col-status ${getSortDirectionClass('status')}`} onClick={() => requestSort('status')}>
                                        <strong>Data / Status</strong>
                                    </th>
                                    <th className={`col-identificador ${getSortDirectionClass('ativo')}`} onClick={() => requestSort('ativo')}>
                                        <strong>Identificador</strong><br /><span>Ativo &nbsp;&nbsp; Atividade</span>
                                    </th>
                                    <th className={`col-inicio ${getSortDirectionClass('inicio_real')}`} onClick={() => requestSort('inicio_real')}>
                                        <strong>Início</strong><br /><span>Prog &nbsp;&nbsp; Real</span>
                                    </th>
                                    <th className={`col-tempo ${getSortDirectionClass('tempo_prog')}`} onClick={() => requestSort('tempo_prog')}>
                                        <strong>Tempo</strong><br /><span>Prog &nbsp;&nbsp; Real</span>
                                    </th>
                                    <th className={`col-local ${getSortDirectionClass('local_prog')}`} onClick={() => requestSort('local_prog')}>
                                        <strong>Local</strong><br /><span>Prog &nbsp;&nbsp; Real</span>
                                    </th>
                                    <th className={`col-quantidade ${getSortDirectionClass('quantidade_prog')}`} onClick={() => requestSort('quantidade_prog')}>
                                        <strong>Quantidade</strong><br /><span>Prog &nbsp;&nbsp; Real</span>
                                    </th>
                                    <th className="col-detalhamento">Detalhamento</th>
                                </tr>
                            </thead>

                            <tbody>
                                {sortedAndFilteredData.map((row) => {
                                    const isUpdated = updatedRows.has(row.row_hash);
                                    const statusDisplay = calculateStatusDisplay(row);
                                    return (
                                        <tr key={row.row_hash} className={isUpdated ? 'linha-atualizada' : ''}>
                                            <td data-label="Data / Status">
                                                <div className="cell-status-container">
                                                    <span className="status-date">{statusDisplay.date}</span>
                                                    <div title={statusDisplay.tooltip}>
                                                        <div className={`status-icon ${statusDisplay.colorClass}`}></div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td data-label="Identificador">
                                                <div className="cell-prog-real">
                                                    <span><strong>{row.ativo || 'N/A'}</strong></span>
                                                    <span><strong>{row.atividade || 'N/A'}</strong></span>
                                                </div>
                                            </td>

                                            <td data-label="Início">
                                                <div className="cell-prog-real">
                                                    <span><strong>{row.inicio_prog || '--:--'}</strong></span>
                                                    <span><strong>{row.inicio_real || '--:--'}</strong></span>
                                                </div>
                                            </td>

                                            <td data-label="Tempo">
                                                <div className="cell-prog-real">
                                                    <span><strong>{row.tempo_prog || '--:--'}</strong></span>
                                                    <span><strong>{row.tempo_real_override ? row.tempo_real_override : (calculateRealTime(row, now) || '--:--')}</strong></span>
                                                </div>
                                            </td>

                                            <td data-label="Local">
                                                <div className="cell-prog-real">
                                                    <span><strong>{row.local_prog || 'N/A'}</strong></span>
                                                    <span><strong>{row.local_real || 'N/A'}</strong></span>
                                                </div>
                                            </td>

                                            <td data-label="Quantidade">
                                                <div className="cell-prog-real">
                                                    <span><strong>{isNaN(parseFloat(row.quantidade_prog)) ? 0 : row.quantidade_prog}</strong></span>
                                                    <span><strong>{isNaN(parseFloat(row.quantidade_real)) ? 0 : row.quantidade_real}</strong></span>
                                                </div>
                                            </td>

                                            <td data-label="Detalhamento" className="cell-detalhamento">
                                                {row.detalhamento || ''}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {sortedAndFilteredData.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                            Nenhum dado encontrado com os filtros aplicados.
                                        </td>
                                    </tr>
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
