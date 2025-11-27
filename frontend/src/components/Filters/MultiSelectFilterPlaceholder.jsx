import { useState, useEffect, useMemo, useRef } from "react";

export const MultiSelectFilterPlaceholder = ({ label, options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // Novo estado para controlar se abre para cima ou para baixo
  const [positionStyle, setPositionStyle] = useState({}); 
  const ref = useRef(null); // Ref para o wrapper (.filter-item)
  const triggerRef = useRef(null); // Ref para o botão trigger

  // Lógica de cálculo de posição (abrir para cima ou para baixo)
  useEffect(() => {
    if (isOpen && triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 250; // Altura máxima definida no CSS
        const spaceBelow = viewportHeight - triggerRect.bottom;
        
        // Condição: Abrir para cima se o espaço abaixo for menor que a altura do dropdown (250px)
        // E se houver espaço suficiente acima.
        if (spaceBelow < dropdownHeight && triggerRect.top > dropdownHeight) {
            // Abrir para cima (bottom: 100%)
            setPositionStyle({ bottom: '100%', top: 'auto', transform: 'translateY(0)' });
        } else {
            // Abrir para baixo (top: 100%)
            setPositionStyle({ top: '100%', bottom: 'auto', transform: 'translateY(0)' });
        }
    }
  }, [isOpen]); // Recalcula a posição sempre que o popup abre/fecha

  // Lógica de fechar ao clicar fora (mantida)
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
          ref={triggerRef} // Adiciona ref para cálculo de posição
        >
          <span>{displayLabel}</span>
        </button>
        
        {isOpen && (
          <div 
            className="multiselect-dropdown"
            style={positionStyle} // APLICA O ESTILO DE POSIÇÃO DINÂMICA
          >
            
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