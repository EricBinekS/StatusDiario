import { useState, useEffect, useMemo } from 'react';
import './index.css';

// --- Funções Auxiliares ---
function calculateRealTime(startISO, endISO, now) {
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

// --- Componente Principal da Aplicação ---
function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  
  // Estados para cada filtro
  const [filters, setFilters] = useState({
    data: '',
    gerencia: '',
    trecho: '',
    ativo: '',
    atividade: '',
    tipo: ''
  });

  // Efeito para buscar dados e configurar timers
  useEffect(() => {
    async function fetchData() {
      try {
        const url = `/data.json?v=${new Date().getTime()}`;
        const response = await fetch(url);
        const jsonData = await response.json();
        setRawData(jsonData);
      } catch (error) {
        console.error("Erro ao buscar os dados:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const timerId = setInterval(() => setNow(new Date()), 1000); // Atualiza o timer a cada segundo
    const dataFetchId = setInterval(fetchData, 60000); // Busca novos dados a cada minuto
    return () => {
      clearInterval(timerId);
      clearInterval(dataFetchId);
    };
  }, []);

  // Função para lidar com a mudança em qualquer filtro
  const handleFilterChange = (filterName, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  // Lógica de filtragem otimizada que só re-calcula quando os dados ou filtros mudam
  const filteredData = useMemo(() => {
    return rawData.filter(row => {
      if (filters.data && row['DATA']) {
        const rowDate = new Date(row['DATA']).toISOString().split('T')[0];
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

  // Renderização da Interface
  return (
    <>
      <header>
        <h1>PAINEL PCM</h1>
        <img src="/rumo-logo.svg" alt="Rumo Logo" className="logo" />
      </header>
      <main>
        <section className="filters">
            <div className="filter-item"><label htmlFor="data">Data:</label><input type="date" id="data" value={filters.data} onChange={(e) => handleFilterChange('data', e.target.value)} /></div>
            <div className="filter-item"><label htmlFor="gerencia">Gerencia:</label><input type="text" id="gerencia" value={filters.gerencia} onChange={(e) => handleFilterChange('gerencia', e.target.value)} /></div>
            <div className="filter-item"><label htmlFor="trecho">Trecho:</label><input type="text" id="trecho" value={filters.trecho} onChange={(e) => handleFilterChange('trecho', e.target.value)} /></div>
            <div className="filter-item"><label htmlFor="ativo">Ativo:</label><input type="text" id="ativo" value={filters.ativo} onChange={(e) => handleFilterChange('ativo', e.target.value)} /></div>
            <div className="filter-item"><label htmlFor="atividade">Atividade:</label><input type="text" id="atividade" value={filters.atividade} onChange={(e) => handleFilterChange('atividade', e.target.value)} /></div>
            <div className="filter-item"><label htmlFor="tipo">Tipo:</label><input type="text" id="tipo" value={filters.tipo} onChange={(e) => handleFilterChange('tipo', e.target.value)} /></div>
        </section>

        <section className="tabela-wrapper">
          {loading ? (
            <p>Carregando dados...</p>
          ) : (
            <table className="grid-table">
              <thead>
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
                {filteredData.map((row, index) => (
                  <tr key={index}>
                    <td dangerouslySetInnerHTML={{ __html: row.display_identificador || '' }}></td>
                    <td dangerouslySetInnerHTML={{ __html: row.display_inicio || '' }}></td>
                    <td>
                        {row.display_tempo_prog || ''}<br/>
                        {calculateRealTime(row.timer_start_timestamp, row.timer_end_timestamp, now)}
                    </td>
                    <td dangerouslySetInnerHTML={{ __html: row.display_local || '' }}></td>
                    <td dangerouslySetInnerHTML={{ __html: row.display_quantidade || '' }}></td>
                    <td className="cell-detalhamento">{row.display_detalhamento || ''}</td>
                  </tr>
                ))}
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