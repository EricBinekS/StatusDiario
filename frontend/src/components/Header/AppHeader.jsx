import { formatLastUpdated } from "../../utils/dateUtils";

export const AppHeader = ({ lastUpdatedTimestamp, nextUpdateIn, loading }) => {
  return (
    <header>
      <div className="title-container">
        <h1>PAINEL INTERVALOS - PCM</h1>
        <div className="update-info">
          <p className="last-updated">
            Última Atualização: {formatLastUpdated(lastUpdatedTimestamp, loading)}
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
  );
};