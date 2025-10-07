import { useState, useEffect, useMemo, useRef } from 'react'; // Adicionado useRef
import './index.css';

// --- Funções Auxiliares ---

function calculateRealTime(startISO, endISO, now) {
  // ... (função sem alterações)
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

// NOVO: Função para encontrar diferenças entre os dados
function findUpdatedRows(oldData, newData) {
  const updated = new Set();
  // Mapeia os dados antigos por uma chave única para busca rápida
  const oldDataMap = new Map(
    oldData.map(row => [
      `${row.ATIVO}-${row.Atividade}-${row.DATA}`, // Chave composta
      JSON.stringify(row) // "Assinatura" da linha
    ])
  );

  newData.forEach(newRow => {
    const key = `${newRow.ATIVO}-${newRow.Atividade}-${newRow.DATA}`;
    const newSignature = JSON.stringify(newRow);
    const oldSignature = oldDataMap.get(key);

    // Se a linha é nova ou se a assinatura mudou, ela foi atualizada.
    if (!oldSignature || oldSignature !== newSignature) {
      updated.add(key);
    }
  });

  return updated;
}


// --- Componente Principal da Aplicação ---
function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  
  // NOVO: Estado para guardar as chaves das linhas atualizadas
  const [updatedRows, setUpdatedRows] = useState(new Set());
  // NOVO: Ref para guardar os dados da busca anterior
  const previousDataRef = useRef([]);
  
  const [filters, setFilters] = useState({
    data: '', gerencia: '', trecho: '',
    ativo: '', atividade: '', tipo: ''
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const url = `data.json?v=${new Date().getTime()}`;
        const response = await fetch(url);
        const jsonData = await response.json();
        
        // --- LÓGICA DE COMPARAÇÃO ---
        if (previousDataRef.current.length > 0) {
          const changes = findUpdatedRows(previousDataRef.current, jsonData);
          if (changes.size > 0) {
            setUpdatedRows(changes);
            // Limpa os destaques após 2 segundos
            setTimeout(() => setUpdatedRows(new Set()), 2000);
          }
        }
        
        setRawData(jsonData);
        // Guarda os dados atuais para a próxima comparação
        previousDataRef.current = jsonData;
        
      } catch (error) {
        console.error("Erro ao buscar os dados:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const timerId = setInterval(() => setNow(new Date()), 1000);
    const dataFetchId = setInterval(fetchData, 60000);
    return () => {
      clearInterval(timerId);
      clearInterval(dataFetchId);
    };
  }, []);

  const handleFilterChange = (filterName, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  const filteredData = useMemo(() => {
    // ... (lógica de filtro sem alterações)
    return rawData.filter(row => {
        if (filters.data && row['DATA']) {
          const rowDate = new Date(row['DATA'] + 'T00:00:00').toISOString().split('T')[0];
          if (rowDate !== filters.data) return false;
        }
        if (filters.gerencia && !String(row['Gerência da Via'] || '').toLowerCase().includes(filters.gerencia.toLowerCase())) return false;
        if (filters.trecho && !String(row['Trecho'] || '').toLowerCase().includes(filters.trecho.toLowerCase())) return false;
        if (filters.ativo && !String(row['ATIVO'] || '').toLowerCase().includes(filters.ativo.toLowerCase())) return false;
        if (filters.atividade && !String(row['Atividade'] || '').toLowerCase().includes(filters.atividade.toLowerCase())) return false;
        if (filters.tipo && !String(row['Programar para D+1'] || '').toLowerCase().includes(filters.tipo.toLowerCase())) return false;
        return true;
      });
  }, [rawData, filters]);

  return (
    <>
      <header>
        <h1>PAINEL PCM</h1>
        <img src="rumo-logo.svg" alt="Rumo Logo" className="logo" />
      </header>
      <main>
        <section className="filters">
            {/* ... (filtros sem alterações) */}
            <div className="filter-item"><label htmlFor="data">Data:</label><input type="date" id="data" value={filters.data} onChange={(e) => handleFilterChange('data', e.target.value)} /></div>
            <div className="filter-item"><label htmlFor="gerencia">Gerencia:</label><input type="text" id="gerencia" value={filters.gerencia} onChange={(e) => handleFilterChange('gerencia', e.target.value)} /></div>
            <div className="filter-item"><label htmlFor="trecho">Trecho:</label><input type="text" id="trecho" value={filters.trecho} onChange={(e) => handleFilterChange('trecho', e.target.value)} /></div>
            <div className="filter-item"><label htmlFor="ativo">Ativo:</label><input type="text" id="ativo" value={filters.ativo} onChange={(e) => handleFilterChange('ativo', e.target.value)} /></div>
            <div className="filter-item"><label htmlFor="atividade">Atividade:</label><input type="text" id="atividade" value={filters.atividade} onChange={(e) => handleFilterChange('atividade', e.target.value)} /></div>
            <div className="filter-item"><label htmlFor="tipo">Tipo:</label><input type="text" id="tipo" value={filters.tipo} onChange={(e) => handleFilterChange('tipo', e.target.value)} /></div>
        </section>

        <section className="tabela-wrapper">
          {loading ? ( <p>Carregando dados...</p> ) : (
            <table className="grid-table">
              <thead>
                {/* ... (cabeçalho da tabela sem alterações) */}
                <tr>
                  <th className="col-identificador"><strong>Identificador</strong><br /><span style={{ fontWeight: 'normal' }}>Ativo &nbsp;&nbsp;&nbsp;&nbsp; Atividade</span></th>
                  <th className="col-inicio"><strong>Inicio</strong><br /><span style={{ fontWeight: 'normal' }}>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span></th>
                  <th className="col-tempo"><strong>Tempo</strong><br /><span style={{ fontWeight: 'normal' }}>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span></th>
                  <th className="col-local"><strong>Local</strong><br /><span style={{ fontWeight: 'normal' }}>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span></th>
                  <th className="col-quantidade"><strong>Quantidade</strong><br /><span style={{ fontWeight: 'normal' }}>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span></th>
                  <th className="col-detalhamento">Detalhamento</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => {
                  // NOVO: Verifica se a linha atual deve ser destacada
                  const rowKey = `${row.ATIVO}-${row.Atividade}-${row.DATA}`;
                  const isUpdated = updatedRows.has(rowKey);

                  return (
                    <tr key={index} className={isUpdated ? 'linha-atualizada' : ''}>
                      {/* ... (o conteúdo das células <td> permanece o mesmo) ... */}
                      <td>
                        <div className="cell-prog-real">
                          <span><strong>{row.ATIVO || 'N/A'}</strong></span>
                          <span>{row.Atividade || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-prog-real">
                          <span><strong>{row.inicio_prog || '--:--'}</strong></span>
                          <span><strong>{row.inicio_real || '--:--'}</strong></span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-prog-real">
                          <span><strong>{row.tempo_prog || '--:--'}</strong></span>
                          <span><strong>{calculateRealTime(row.timer_start_timestamp, row.timer_end_timestamp, now) || '--:--'}</strong></span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-prog-real">
                          <span><strong>{row.local_prog || 'N/A'}</strong></span>
                          <span><strong>{row.local_real || 'N/A'}</strong></span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-prog-real">
                          <span><strong>{isNaN(parseFloat(row.quantidade_prog)) ? 0 : row.quantidade_prog}</strong></span>
                          <span><strong>{isNaN(parseFloat(row.quantidade_real)) ? 0 : row.quantidade_real}</strong></span>
                        </div>
                      </td>
                      <td className="cell-detalhamento">{row.detalhamento || ''}</td>
                    </tr>
                  );
                })}
                {filteredData.length === 0 && !loading && (
                    <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Nenhum dado encontrado com os filtros aplicados.</td>
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