import { calculateStatusDisplay, calculateRealTimeDisplay } from "../../utils/dataUtils";

export const AtividadesTable = ({ data, now, updatedRows, requestSort, getSortDirectionClass, loading, rawDataCount }) => {

  const getRealTime = (row) => {
    if (row.tempo_real_override) {
      return row.tempo_real_override;
    }
    
    const realTime = calculateRealTimeDisplay(row, now); 
    
    if (realTime.isRunning) {
        return <span className="timer-running">{realTime.time}</span>;
    }
    
    return realTime.time || "--:--";
  };

  if (loading) {
    return (
      <section className="tabela-wrapper">
        <p className="loading-message">Carregando dados...</p>
      </section>
    );
  }

  if (rawDataCount === 0) {
    return (
      <section className="tabela-wrapper">
        <p className="loading-message">Nenhum dado disponível.</p>
      </section>
    );
  }

  return (
    <section className="tabela-wrapper">
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
              className={`col-identificador ${getSortDirectionClass("ativo")}`}
              onClick={() => requestSort("ativo")}
            >
              <strong>Identificador</strong>
              <br />
              <span>Ativo &nbsp;&nbsp; Atividade</span>
            </th>

            <th
              className={`col-inicio ${getSortDirectionClass("inicio_real")}`}
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
              className={`col-quantidade ${getSortDirectionClass("quantidade_prog")}`}
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
          {data.map((row) => {
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
                        {getRealTime(row)}
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

                <td data-label="Detalhamento" className="cell-detalhamento">
                  <span>{row.detalhamento || "—"}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};