import React from "react";
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
            <th className={`col-status ${getSortDirectionClass("status")}`} onClick={() => requestSort("status")}>
              Data / Status
            </th>
            <th className={`col-identificador ${getSortDirectionClass("ativo")}`} onClick={() => requestSort("ativo")}>
              Identificador <br/> 
              <span style={{fontSize:'0.85em', fontWeight:'normal'}}>Ativo | Atividade</span>
            </th>
            <th className={`col-inicio ${getSortDirectionClass("inicio_real")}`} onClick={() => requestSort("inicio_real")}>
              Início <br/> 
              <span style={{fontSize:'0.85em', fontWeight:'normal'}}>Prog | Real</span>
            </th>
            <th className={`col-tempo ${getSortDirectionClass("tempo_prog")}`} onClick={() => requestSort("tempo_prog")}>
              Tempo <br/> 
              <span style={{fontSize:'0.85em', fontWeight:'normal'}}>Prog | Real</span>
            </th>
            <th className={`col-local ${getSortDirectionClass("local_prog")}`} onClick={() => requestSort("local_prog")}>
              Local <br/> 
              <span style={{fontSize:'0.85em', fontWeight:'normal'}}>Prog | Real</span>
            </th>
            <th className={`col-quantidade ${getSortDirectionClass("quantidade_prog")}`} onClick={() => requestSort("quantidade_prog")}>
              Qtd <br/> 
              <span style={{fontSize:'0.85em', fontWeight:'normal'}}>Prog | Real</span>
            </th>
            <th className="col-detalhamento">Detalhamento</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => {
            const isUpdated = updatedRows.has(row.row_hash);
            const statusDisplay = calculateStatusDisplay(row);

            return (
              <tr key={row.row_hash} className={isUpdated ? "linha-atualizada" : ""}>
                {/* STATUS */}
                <td>
                  <div className="cell-status-container">
                    <span className="status-date">{statusDisplay.date}</span>
                    <div title={statusDisplay.tooltip}>
                      <div className={`status-icon ${statusDisplay.colorClass}`}></div>
                    </div>
                  </div>
                </td>

                {/* IDENTIFICADOR */}
                <td>
                  <div className="cell-prog-real">
                    <span className="text-ativo">{row.ativo || "N/A"}</span>
                    {/* Classe .text-atividade cuida do "sem negrito" e "quebra de linha" */}
                    <span className="text-atividade" title={row.atividade}>
                      {row.atividade || "N/A"}
                    </span>
                  </div>
                </td>

                {/* INÍCIO */}
                <td>
                  <div className="cell-prog-real">
                    <span>{row.inicio_prog || "--:--"}</span>
                    <strong>{row.inicio_real || "--:--"}</strong>
                  </div>
                </td>

                {/* TEMPO */}
                <td>
                  <div className="cell-prog-real">
                    <span>{row.tempo_prog || "--:--"}</span>
                    <strong>{getRealTime(row)}</strong>
                  </div>
                </td>

                {/* LOCAL */}
                <td>
                  <div className="cell-prog-real">
                    <span>{row.local_prog || "N/A"}</span>
                    <strong>{row.local_real || "N/A"}</strong>
                  </div>
                </td>

                {/* QUANTIDADE */}
                <td>
                  <div className="cell-prog-real">
                    <span>{row.quantidade_prog != null ? row.quantidade_prog : "--"}</span>
                    <strong>{row.quantidade_real != null ? row.quantidade_real : "--"}</strong>
                  </div>
                </td>

                {/* DETALHAMENTO */}
                <td>
                  {/* Classe .text-detalhamento permite quebra de linha */}
                  <span className="text-detalhamento">
                    {row.detalhamento || "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};