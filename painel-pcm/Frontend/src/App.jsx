import { useState, useEffect, useMemo, useRef } from 'react';
import './index.css';
import { socket, on } from './socket';

function calculateRealTime(startISO, endISO, now) {
    // DEBUG DO TIMER: Esta linha vai nos mostrar no console os dados que a função está recebendo
    console.log('Timer Debug:', { startISO, endISO });

    if (endISO) {
      const start = new Date(startISO);
      const end = new Date(endISO);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return "00:00";
      if (end < start) { end.setDate(end.getDate() + 1); }
      const diffMs = end - start;
      if (diffMs < 0) return "00:00";
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    if (startISO) {
      const start = new Date(startISO);
      if (isNaN(start.getTime())) return "";
      const diffMs = now - start;
      if (diffMs < 0) return "00:00";
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      return <span className="timer-running">{`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`}</span>;
    }
    return "";
}
  
function findUpdatedRows(oldData, newData) {
    const updated = new Set();
    const oldDataMap = new Map(
      oldData.map(row => [`${row.ATIVO}-${row.Atividade}-${row.DATA}`, JSON.stringify(row)])
    );
    newData.forEach(newRow => {
      const key = `${newRow.ATIVO}-${newRow.Atividade}-${newRow.DATA}`;
      const newSignature = JSON.stringify(newRow);
      const oldSignature = oldDataMap.get(key);
      if (!oldSignature || oldSignature !== newSignature) {
        updated.add(key);
      }
    });
    return updated;
}

function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [updatedRows, setUpdatedRows] = useState(new Set());
  const previousDataRef = useRef([]);
  
  const [filters, setFilters] = useState({
    data: '', gerencia: '', trecho: '', sub: '',
    ativo: '', atividade: '', tipo: ''
  });

  const [sortConfig, setSortConfig] = useState({ key: 'inicio_real', direction: 'ascending' });

  useEffect(() => {
    async function fetchData() {
      try {
        const url = `${import.meta.env.VITE_API_URL}/api/atividades`;
        const response = await fetch(url);
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        const jsonData = await response.json();
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
    socket.connect();
    on('data_updated', (data) => {
      console.log('Recebido evento de atualização do servidor!', data.message);
      fetchData();
    });
    const timerId = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(timerId);
      socket.disconnect();
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
    return Array.from(options).sort();
  };

  const gerenciaOptions = useMemo(() => getUniqueOptions(rawData, 'Gerência da Via'), [rawData]);
  const trechoOptions = useMemo(() => {
    let filteredData = rawData;
    if (filters.gerencia) { filteredData = rawData.filter(row => row['Gerência da Via'] === filters.gerencia); }
    return getUniqueOptions(filteredData, 'Coordenação da Via');
  }, [rawData, filters.gerencia]);
  const subOptions = useMemo(() => {
    let filteredData = rawData;
    if (filters.gerencia) { filteredData = filteredData.filter(row => row['Gerência da Via'] === filters.gerencia); }
    if (filters.trecho) { filteredData = filteredData.filter(row => row['Coordenação da Via'] === filters.trecho); }
    return getUniqueOptions(filteredData, 'SUB');
  }, [rawData, filters.gerencia, filters.trecho]);
  const atividadeOptions = useMemo(() => {
    let filteredData = rawData;
    if (filters.gerencia) filteredData = filteredData.filter(row => row['Gerência da Via'] === filters.gerencia);
    if (filters.trecho) filteredData = filteredData.filter(row => row['Coordenação da Via'] === filters.trecho);
    if (filters.sub) filteredData = filteredData.filter(row => String(row['SUB']) === filters.sub);
    return getUniqueOptions(filteredData, 'Atividade');
  }, [rawData, filters.gerencia, filters.trecho, filters.sub]);
  const tipoOptions = useMemo(() => {
    let filteredData = rawData;
    if (filters.gerencia) filteredData = filteredData.filter(row => row['Gerência da Via'] === filters.gerencia);
    if (filters.trecho) filteredData = filteredData.filter(row => row['Coordenação da Via'] === filters.trecho);
    if (filters.sub) filteredData = filteredData.filter(row => String(row['SUB']) === filters.sub);
    return getUniqueOptions(filteredData, 'Programar para D+1');
  }, [rawData, filters.gerencia, filters.trecho, filters.sub]);

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    if (filterName === 'gerencia') {
      newFilters.trecho = ''; newFilters.sub = ''; newFilters.atividade = ''; newFilters.tipo = '';
    }
    if (filterName === 'trecho') {
      newFilters.sub = ''; newFilters.atividade = ''; newFilters.tipo = '';
    }
    setFilters(newFilters);
  };
  
  const sortedAndFilteredData = useMemo(() => {
    if (!Array.isArray(rawData)) return [];
    let filterableData = [...rawData];
    filterableData = filterableData.filter(row => {
      // CORREÇÃO DO FILTRO DE DATA
      if (filters.data && row['DATA'] !== filters.data) return false;
      
      if (filters.gerencia && row['Gerência da Via'] !== filters.gerencia) return false;
      if (filters.trecho && row['Coordenação da Via'] !== filters.trecho) return false;
      if (filters.sub && String(row['SUB']) !== filters.sub) return false;
      if (filters.ativo && !String(row['ATIVO'] || '').toLowerCase().includes(filters.ativo.toLowerCase())) return false;
      if (filters.atividade && row['Atividade'] !== filters.atividade) return false;
      if (filters.tipo && row['Programar para D+1'] !== filters.tipo) return false;
      return true;
    });
    if (sortConfig.key) {
      filterableData.sort((a, b) => {
        const valA = a[sortConfig.key]; const valB = b[sortConfig.key];
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filterableData;
  }, [rawData, filters, sortConfig]);

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
        <img src="rumo-logo.svg" alt="Rumo Logo" className="logo" />
      </header>
      <main>
        <section className="filters">
            <div className="filter-item"><label htmlFor="data">Data:</label><input type="date" id="data" value={filters.data} onChange={(e) => handleFilterChange('data', e.target.value)} /></div>
            <div className="filter-item"><label htmlFor="gerencia">Gerência:</label><select id="gerencia" value={filters.gerencia} onChange={(e) => handleFilterChange('gerencia', e.target.value)}><option value="">Todas</option>{gerenciaOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
            <div className="filter-item"><label htmlFor="trecho">Trecho:</label><select id="trecho" value={filters.trecho} onChange={(e) => handleFilterChange('trecho', e.target.value)}><option value="">Todos</option>{trechoOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
            <div className="filter-item"><label htmlFor="sub">Sub:</label><select id="sub" value={filters.sub} onChange={(e) => handleFilterChange('sub', e.target.value)}><option value="">Todos</option>{subOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
            <div className="filter-item"><label htmlFor="ativo">Ativo:</label><input type="text" id="ativo" value={filters.ativo} onChange={(e) => handleFilterChange('ativo', e.target.value)} /></div>
            <div className="filter-item"><label htmlFor="atividade">Atividade:</label><select id="atividade" value={filters.atividade} onChange={(e) => handleFilterChange('atividade', e.target.value)}><option value="">Todas</option>{atividadeOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
            <div className="filter-item">
              <label htmlFor="tipo">Tipo:</label>
              <select id="tipo" value={filters.tipo} onChange={(e) => handleFilterChange('tipo', e.target.value)}>
                <option value="">Todos</option>
                {tipoOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
        </section>

        <section className="tabela-wrapper">
          {loading ? ( <p>Carregando dados...</p> ) : (
            <table className="grid-table">
              <thead>
                <tr>
                  <th className={`col-identificador ${getSortDirectionClass('ATIVO')}`} onClick={() => requestSort('ATIVO')}><strong>Identificador</strong><br /><span>Ativo &nbsp;&nbsp;&nbsp;&nbsp; Atividade</span></th>
                  <th className={`col-inicio ${getSortDirectionClass('inicio_real')}`} onClick={() => requestSort('inicio_real')}><strong>Inicio</strong><br /><span>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span></th>
                  <th className={`col-tempo ${getSortDirectionClass('tempo_prog')}`} onClick={() => requestSort('tempo_prog')}><strong>Tempo</strong><br /><span>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span></th>
                  <th className={`col-local ${getSortDirectionClass('local_prog')}`} onClick={() => requestSort('local_prog')}><strong>Local</strong><br /><span>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span></th>
                  <th className={`col-quantidade ${getSortDirectionClass('quantidade_prog')}`} onClick={() => requestSort('quantidade_prog')}><strong>Quantidade</strong><br /><span>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span></th>
                  <th className="col-detalhamento">Detalhamento</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredData.map((row, index) => {
                  const rowKey = `${row.ATIVO}-${row.Atividade}-${row.DATA}`;
                  const isUpdated = updatedRows.has(rowKey);
                  return (
                    <tr key={index} className={isUpdated ? 'linha-atualizada' : ''}>
                      <td data-label="Identificador"><div className="cell-prog-real"><span><strong>{row.ATIVO || 'N/A'}</strong></span><span>{row.Atividade || 'N/A'}</span></div></td>
                      <td data-label="Início"><div className="cell-prog-real"><span><strong>{row.inicio_prog || '--:--'}</strong></span><span><strong>{row.inicio_real || '--:--'}</strong></span></div></td>
                      <td data-label="Tempo"><div className="cell-prog-real"><span><strong>{row.tempo_prog || '--:--'}</strong></span><span><strong>{calculateRealTime(row.timer_start_timestamp, row.timer_end_timestamp, now) || '--:--'}</strong></span></div></td>
                      <td data-label="Local"><div className="cell-prog-real"><span><strong>{row.local_prog || 'N/A'}</strong></span><span><strong>{row.local_real || 'N/A'}</strong></span></div></td>
                      <td data-label="Quantidade"><div className="cell-prog-real"><span><strong>{isNaN(parseFloat(row.quantidade_prog)) ? 0 : row.quantidade_prog}</strong></span><span><strong>{isNaN(parseFloat(row.quantidade_real)) ? 0 : row.quantidade_real}</strong></span></div></td>
                      <td data-label="Detalhamento" className="cell-detalhamento">{row.detalhamento || ''}</td>
                    </tr>
                  );
                })}
                {sortedAndFilteredData.length === 0 && !loading && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Nenhum dado encontrado com os filtros aplicados.</td></tr>
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