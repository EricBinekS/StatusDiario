import { useState, useEffect, useMemo, useRef } from "react";
import "./index.css";

const getTodaysDateStringForReact = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getUniqueOptions = (data, key) => {
  if (!Array.isArray(data)) return [];
  const options = new Set();
  data.forEach((row) => {
    const value = row[key];
    if (value != null && value !== "" && value !== "-" && value !== "0") {
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
    if (end < start)
      effectiveEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    const diffMs = effectiveEnd - start;
    if (diffMs < 0 || diffMs > 36 * 60 * 60 * 1000) return "--:--";
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  if (startISO) {
    const start = new Date(startISO);
    if (isNaN(start.getTime())) return "";
    const diffMs = now - start;
    if (diffMs < 0 || diffMs > 36 * 60 * 60 * 1000) return "--:--";
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return (
      <span className="timer-running">{`${String(hours).padStart(
        2,
        "0"
      )}:${String(minutes).padStart(2, "0")}`}</span>
    );
  }

  return "--:--";
}

function findUpdatedRows(oldData, newData) {
  const updated = new Set();
  const oldDataMap = new Map(
    oldData.map((row) => [row.row_hash, JSON.stringify(row)])
  );

  newData.forEach((newRow) => {
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
    ? new Date(rawDate).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
        day: "2-digit",
        month: "2-digit",
      })
    : "N/A";

  let colorClass = "status-gray";
  let tooltipText = "Status não definido";

  if (statusValue === 0 || statusValue === "0")
    ((colorClass = "status-red"), (tooltipText = "Status 0 (Vermelho)"));
  else if (statusValue === 1 || statusValue === "1")
    ((colorClass = "status-yellow"), (tooltipText = "Status 1 (Amarelo)"));
  else if (statusValue === 2 || statusValue === "2")
    ((colorClass = "status-green"), (tooltipText = "Status 2 (Verde)"));
  else if (typeof statusValue === "string") {
    tooltipText = statusValue;
    const lowerStatus = statusValue.toLowerCase();
    if (lowerStatus.includes("concluído") || lowerStatus.includes("concluido"))
      colorClass = "status-green";
    else if (lowerStatus.includes("andamento")) colorClass = "status-yellow";
    else if (lowerStatus.includes("programado")) colorClass = "status-gray";
    else if (lowerStatus.includes("cancelado")) colorClass = "status-red";
  }

  return { date: formattedDate, colorClass, tooltip: tooltipText };
}

const parseHHMMtoMinutes = (hhmmStr) => {
  if (!hhmmStr || typeof hhmmStr !== "string" || hhmmStr.includes("--"))
    return 0;
  const parts = hhmmStr.split(":");
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

const calculateRealizedMinutes = (row, now) => {
  if (
    row.tempo_real_override === "Esp" ||
    row.tempo_real_override === "BLOCO"
  ) {
    return 0;
  }

  const startISO = row.timer_start_timestamp;
  const endISO = row.timer_end_timestamp;

  if (endISO) {
    const start = new Date(startISO);
    const end = new Date(endISO);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    let effectiveEnd = end;
    if (end < start)
      effectiveEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);

    const diffMs = effectiveEnd - start;
    if (diffMs < 0 || diffMs > 36 * 60 * 60 * 1000) return 0;

    return Math.floor(diffMs / 60000);
  }

  if (startISO) {
    const start = new Date(startISO);
    if (isNaN(start.getTime())) return 0;

    const diffMs = now - start;
    if (diffMs < 0 || diffMs > 36 * 60 * 60 * 1000) return 0;

    return Math.floor(diffMs / 60000);
  }

  return 0;
};

const calculateAdherence = (data, now) => {
  if (!data || data.length === 0) {
    return { adherence: "0.0" };
  }

  let totalProgMinutes = 0;
  let totalRealMinutes = 0;

  data.forEach((row) => {
    totalProgMinutes += parseHHMMtoMinutes(row.tempo_prog);
    totalRealMinutes += calculateRealizedMinutes(row, now);
  });

  const adherence =
    totalProgMinutes > 0 ? (totalRealMinutes / totalProgMinutes) * 100 : 0;

  return {
    adherence: adherence.toFixed(1),
  };
};

const MultiSelectFilterPlaceholder = ({ label, options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option =>
      String(option).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const handleSelectToggle = (value) => {
    let newValues;
    if (selectedValues.includes(value)) {
      newValues = selectedValues.filter(v => v !== value);
    } else {
      newValues = [...selectedValues, value];
    }
    onChange(newValues);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      onChange(options);
    } else {
      onChange([]);
    }
  };
  
  const displayLabel = selectedValues.length === options.length && options.length > 0
    ? "Todos"
    : selectedValues.length > 0
    ? `${selectedValues.length} Selecionados`
    : "Todos";

  const allSelected = options.length > 0 && selectedValues.length === options.length;

  return (
    <div className="filter-item" ref={ref}>
      <label htmlFor={label}>{label}:</label>
      <div className="multiselect-container" style={{ position: 'relative' }}>
        <button
          id={label}
          className="filter-item-trigger"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{displayLabel}</span>
        </button>
        
        {isOpen && (
          <div className="multiselect-dropdown">
            
            <div className="search-input-container">
              <input 
                type="text" 
                placeholder="Pesquisar" 
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="header-all">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={allSelected} 
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <span>Todos</span>
              </label>
            </div>

            <div className="option-list">
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '4px 7px', color: 'var(--cor-texto-secundario)' }}>Nenhuma opção encontrada.</div>
              ) : (
                filteredOptions.map((option) => (
                  <label key={option} className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={selectedValues.includes(option)} 
                      onChange={() => handleSelectToggle(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const [rawData, setRawData] = useState([]);
  const [updatedRows, setUpdatedRows] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "status",
    direction: "descending",
  });
  const [error, setError] = useState(null);
  const previousDataRef = useRef([]);
  const [filters, setFilters] = useState({
    data: getTodaysDateStringForReact(),
    gerencia: [],
    trecho: [],
    sub: [],
    ativo: "",
    atividade: [],
    tipo: [],
  });
  const [nextUpdateIn, setNextUpdateIn] = useState("Calculando...");

  useEffect(() => {
    async function fetchData() {
      try {
        const url = `${import.meta.env.VITE_API_URL}/api/atividades`;
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
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

  useEffect(() => {
    if (lastUpdatedTimestamp) {
      const UPDATE_INTERVAL_MS = 10 * 60 * 1000;

      const nextUpdateTimestamp =
        lastUpdatedTimestamp.getTime() + UPDATE_INTERVAL_MS;

      const diffMs = nextUpdateTimestamp - now.getTime();

      if (diffMs <= 0) {
        setNextUpdateIn("Atualizando...");
      } else {
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        setNextUpdateIn(
          `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
            2,
            "0"
          )}`
        );
      }
    } else {
      setNextUpdateIn("Aguardando dados...");
    }
  }, [now, lastUpdatedTimestamp]);

  const gerenciaOptions = useMemo(
    () => getUniqueOptions(rawData, "gerência_da_via"),
    [rawData]
  );

  const trechoOptions = useMemo(() => {
    let d = rawData;
    if (filters.gerencia.length > 0)
      d = d.filter((r) => filters.gerencia.includes(String(r.gerência_da_via)));
    return getUniqueOptions(d, "coordenação_da_via");
  }, [rawData, filters.gerencia]);

  const subOptions = useMemo(() => {
    let d = rawData;
    if (filters.gerencia.length > 0)
      d = d.filter((r) => filters.gerencia.includes(String(r.gerência_da_via)));
    if (filters.trecho.length > 0)
      d = d.filter((r) => filters.trecho.includes(String(r.coordenação_da_via)));
    return getUniqueOptions(d, "sub");
  }, [rawData, filters.gerencia, filters.trecho]);

  const atividadeOptions = useMemo(() => {
    let d = rawData;
    if (filters.gerencia.length > 0)
      d = d.filter((r) => filters.gerencia.includes(String(r.gerência_da_via)));
    if (filters.trecho.length > 0)
      d = d.filter((r) => filters.trecho.includes(String(r.coordenação_da_via)));
    if (filters.sub.length > 0) 
      d = d.filter((r) => filters.sub.includes(String(r.sub)));
    return getUniqueOptions(d, "atividade");
  }, [rawData, filters.gerencia, filters.trecho, filters.sub]);

  const tipoOptions = useMemo(() => {
    let d = rawData;
    if (filters.gerencia.length > 0)
      d = d.filter((r) => filters.gerencia.includes(String(r.gerência_da_via)));
    if (filters.trecho.length > 0)
      d = d.filter((r) => filters.trecho.includes(String(r.coordenação_da_via)));
    if (filters.sub.length > 0) 
      d = d.filter((r) => filters.sub.includes(String(r.sub)));
    return getUniqueOptions(d, "tipo");
  }, [rawData, filters.gerencia, filters.trecho, filters.sub]);

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    if (filterName === "gerencia") {
      newFilters.trecho = [];
      newFilters.sub = [];
      newFilters.atividade = [];
      newFilters.tipo = [];
    }
    if (filterName === "trecho") {
      newFilters.sub = [];
      newFilters.atividade = [];
      newFilters.tipo = [];
    }
    if (filterName === "sub") {
      newFilters.atividade = [];
      newFilters.tipo = [];
    }
    setFilters(newFilters);
  }; 

  const sortedAndFilteredData = useMemo(() => {
    if (!Array.isArray(rawData)) return [];

    let filterableData = rawData.filter((row) => {
      if (filters.data && (!row.data || !row.data.startsWith(filters.data)))
        return false;

      if (
        filters.ativo &&
        (!row.ativo ||
          !String(row.ativo)
            .toLowerCase()
            .includes(filters.ativo.toLowerCase()))
      )
        return false;

      if (filters.gerencia.length > 0 && !filters.gerencia.includes(String(row.gerência_da_via)))
        return false;
      if (filters.trecho.length > 0 && !filters.trecho.includes(String(row.coordenação_da_via)))
        return false;
      if (filters.sub.length > 0 && !filters.sub.includes(String(row.sub)))
        return false;
      if (filters.atividade.length > 0 && !filters.atividade.includes(String(row.atividade)))
        return false;
      if (filters.tipo.length > 0 && !filters.tipo.includes(String(row.tipo)))
        return false;

      return true;
    });

    if (sortConfig.key) {
      const sortKey = sortConfig.key;

      const sortableData = [...filterableData];

      sortableData.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA == null && valB == null) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;

        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        let comparison = 0;

        if (!isNaN(numA) && !isNaN(numB)) {
          comparison = numA - numB;
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }

        return sortConfig.direction === "ascending"
          ? comparison
          : comparison * -1;
      });

      return sortableData;
    }

    return filterableData;
  }, [rawData, filters, sortConfig]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending")
      direction = "descending";
    setSortConfig({ key, direction });
  };

  const getSortDirectionClass = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "ascending" ? "sort-asc" : "sort-desc";
  };

  const formatLastUpdated = (timestamp) => {
    if (loading && !timestamp) return "Carregando...";
    if (!timestamp) return "N/D";
    try {
      return timestamp.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "medium",
      });
    } catch {
      return "Data inválida";
    }
  };

  const isAnyFilterApplied = useMemo(() => {
    if (!filters) return false;
    return Object.entries(filters).some(([key, v]) => {
      if (key === 'data') {
        return v !== getTodaysDateStringForReact();
      }
      if (key === 'ativo') {
        return String(v).trim() !== "";
      }
      return Array.isArray(v) && v.length > 0;
    });
  }, [filters]);

  const globalAdherence = useMemo(() => {
    return calculateAdherence(rawData, now);
  }, [rawData, now]);

  const filteredAdherence = useMemo(() => {
    return calculateAdherence(sortedAndFilteredData, now);
  }, [sortedAndFilteredData, now]);

  const displayedAdherence = useMemo(() => {
    return isAnyFilterApplied ? filteredAdherence : globalAdherence;
  }, [isAnyFilterApplied, filteredAdherence, globalAdherence]);

return (
  <>
    <header>
      <div className="title-container">
        <h1>PAINEL INTERVALOS - PCM</h1>
        <div className="update-info">
          <p className="last-updated">
            Última Atualização: {formatLastUpdated(lastUpdatedTimestamp)}
          </p>
          <p className="next-update">
            Próxima em: <strong>{nextUpdateIn}</strong>
          </p>
        </div>
      </div>

      <div className="header-right-group">
        
        <img src="/rumo-logo.svg" alt="Rumo Logo" className="logo" />
      </div>
    </header>

    <main>
      
      <div className="filters-and-adherence-wrapper">
        
        <section className="filters">
          <div className="filter-item">
            <label htmlFor="data">Data:</label>
            <input
              type="date"
              id="data"
              value={filters.data}
              onChange={(e) => handleFilterChange("data", e.target.value)}
            />
          </div>

          <MultiSelectFilterPlaceholder
            label="Gerência"
            options={gerenciaOptions}
            selectedValues={filters.gerencia}
            onChange={(v) => handleFilterChange("gerencia", v)}
          />

          <MultiSelectFilterPlaceholder
            label="Trecho"
            options={trechoOptions}
            selectedValues={filters.trecho}
            onChange={(v) => handleFilterChange("trecho", v)}
          />

          <MultiSelectFilterPlaceholder
            label="Sub"
            options={subOptions}
            selectedValues={filters.sub}
            onChange={(v) => handleFilterChange("sub", v)}
          />

          <div className="filter-item">
            <label htmlFor="ativo">Ativo:</label>
            <input
              type="text"
              id="ativo"
              value={filters.ativo}
              onChange={(e) => handleFilterChange("ativo", e.target.value)}
            />
          </div>

          <MultiSelectFilterPlaceholder
            label="Atividade"
            options={atividadeOptions}
            selectedValues={filters.atividade}
            onChange={(v) => handleFilterChange("atividade", v)}
          />

          <MultiSelectFilterPlaceholder
            label="Tipo"
            options={tipoOptions}
            selectedValues={filters.tipo}
            onChange={(v) => handleFilterChange("tipo", v)}
          />
        </section>
        <div
          className="adherence-container"
          role="status"
          aria-label="Aderência"
        >
          <div className="adherence-box global">
            <span className="adherence-label">
              {isAnyFilterApplied ? "Aderência (Filtro)" : "Aderência Global"}
            </span>
            <span className="adherence-value">
              {displayedAdherence.adherence}%
            </span>
          </div>
        </div>

      </div> 
        <section className="tabela-wrapper">
          {loading && <p className="loading-message">Carregando dados...</p>}

          {!loading && rawData.length === 0 && (
            <p className="loading-message">Nenhum dado disponível.</p>
          )}

          {!loading && rawData.length > 0 && (
            <table className="grid-table">
              <thead>
                <tr>
                  <th
                    className={`col-status ${getSortDirectionClass("status")}`}
                    onClick={() => requestSort("status")}
                  >
                    <strong>Data / Status</strong>
                  </th>

                  <th
                    className={`col-identificador ${getSortDirectionClass(
                      "ativo"
                    )}`}
                    onClick={() => requestSort("ativo")}
                  >
                    <strong>Identificador</strong>
                    <br />
                    <span>Ativo &nbsp;&nbsp; Atividade</span>
                  </th>

                  <th
                    className={`col-inicio ${getSortDirectionClass(
                      "inicio_real"
                    )}`}
                    onClick={() => requestSort("inicio_real")}
                  >
                    <strong>Início</strong>
                    <br />
                    <span>Prog &nbsp;&nbsp; Real</span>
                  </th>

                  <th
                    className={`col-tempo ${getSortDirectionClass("tempo_prog")}`}
                    onClick={() => requestSort("tempo_prog")}
                  >
                    <strong>Tempo</strong>
                    <br />
                    <span>Prog &nbsp;&nbsp; Real</span>
                  </th>

                  <th
                    className={`col-local ${getSortDirectionClass("local_prog")}`}
                    onClick={() => requestSort("local_prog")}
                  >
                    <strong>Local</strong>
                    <br />
                    <span>Prog &nbsp;&nbsp; Real</span>
                  </th>

                  <th
                    className={`col-quantidade ${getSortDirectionClass(
                      "quantidade_prog"
                    )}`}
                    onClick={() => requestSort("quantidade_prog")}
                  >
                    <strong>Quantidade</strong>
                    <br />
                    <span>Prog &nbsp;&nbsp; Real</span>
                  </th>

                  <th className="col-detalhamento">Detalhamento</th>
                </tr>
              </thead>

              <tbody>
                {sortedAndFilteredData.map((row) => {
                  const isUpdated = updatedRows.has(row.row_hash);
                  const statusDisplay = calculateStatusDisplay(row);

                  return (
                    <tr
                      key={row.row_hash}
                      className={isUpdated ? "linha-atualizada" : ""}
                    >
                      <td data-label="Data / Status">
                        <div className="cell-status-container">
                          <span className="status-date">
                            {statusDisplay.date}
                          </span>

                          <div title={statusDisplay.tooltip}>
                            <div
                              className={`status-icon ${statusDisplay.colorClass}`}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td data-label="Identificador">
                        <div className="cell-prog-real">
                          <span>
                            <strong>{row.ativo || "N/A"}</strong>
                          </span>
                          <span>
                            <strong>{row.atividade || "N/A"}</strong>
                          </span>
                        </div>
                      </td>

                      <td data-label="Início">
                        <div className="cell-prog-real">
                          <span>
                            <strong>{row.inicio_prog || "--:--"}</strong>
                          </span>
                          <span>
                            <strong>{row.inicio_real || "--:--"}</strong>
                          </span>
                        </div>
                      </td>

                      <td data-label="Tempo">
                        <div className="cell-prog-real">
                          <span>
                            <strong>{row.tempo_prog || "--:--"}</strong>
                          </span>
                          <span>
                            <strong>
                              {row.tempo_real_override
                                ? row.tempo_real_override
                                : calculateRealTime(row, now) || "--:--"}
                            </strong>
                          </span>
                        </div>
                      </td>

                      <td data-label="Local">
                        <div className="cell-prog-real">
                          <span>
                            <strong>{row.local_prog || "N/A"}</strong>
                          </span>
                          <span>
                            <strong>{row.local_real || "N/A"}</strong>
                          </span>
                        </div>
                      </td>

                      <td data-label="Quantidade">
                        <div className="cell-prog-real">
                          <span>
                            <strong>
                              {row.quantidade_prog != null
                                ? row.quantidade_prog
                                : "--"}
                            </strong>
                          </span>
                          <span>
                            <strong>
                              {row.quantidade_real != null
                                ? row.quantidade_real
                                : "--"}
                            </strong>
                          </span>
                        </div>
                      </td>

                      <td data-label="Detalhamento">
                        <span>{row.detalhamento || "—"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </>
  );
}
export default App;