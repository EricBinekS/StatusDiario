import { MultiSelectFilterPlaceholder } from "./MultiSelectFilterPlaceholder";

export const FiltersSection = ({ filters, handleFilterChange, options, adherence }) => {
  return (
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
          options={options.gerenciaOptions}
          selectedValues={filters.gerencia}
          onChange={(v) => handleFilterChange("gerencia", v)}
        />

        <MultiSelectFilterPlaceholder
          label="Trecho"
          options={options.trechoOptions}
          selectedValues={filters.trecho}
          onChange={(v) => handleFilterChange("trecho", v)}
        />

        <MultiSelectFilterPlaceholder
          label="Sub"
          options={options.subOptions}
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
          options={options.atividadeOptions}
          selectedValues={filters.atividade}
          onChange={(v) => handleFilterChange("atividade", v)}
        />

        <MultiSelectFilterPlaceholder
          label="Tipo"
          options={options.tipoOptions}
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
            {adherence.isAnyFilterApplied ? "Aderência (Filtro)" : "Aderência Global"}
          </span>
          <span className="adherence-value">
            {adherence.displayedAdherence.adherence}%
          </span>
        </div>
      </div>
    </div>
  );
};