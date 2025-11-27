import { useState, useEffect, useMemo, useRef } from "react";
import { FilterPortal } from "./FilterPortal"; // Importa o Portal

export const MultiSelectFilterPlaceholder = ({ label, options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState(null); // Posição absoluta
  const ref = useRef(null); // Ref para o wrapper (.filter-item)
  const triggerRef = useRef(null); // Ref para o botão trigger (para medir a posição)

  // 1. Lógica de cálculo de posição e fechamento
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // Lógica para calcular a posição do popup
    if (isOpen && triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 250; 
        const spaceBelow = viewportHeight - triggerRect.bottom;
        
        let position = {
            width: triggerRect.width,
            left: triggerRect.left,
            // O dropdown sempre terá position: fixed (via Portal), então top/bottom são relativos ao viewport
        };
        
        // Abrir para cima se o espaço abaixo for menor que a altura do dropdown
        // E se houver espaço suficiente acima (ou se estiver no modo mobile - que será position: fixed bottom)
        if (spaceBelow < dropdownHeight && triggerRect.top > dropdownHeight) {
            position.bottom = viewportHeight - triggerRect.top; // Distância do fundo até o topo do trigger
            position.top = 'auto';
        } else {
            position.top = triggerRect.bottom;
            position.bottom = 'auto';
        }

        setDropdownPosition(position);
    } else {
        setDropdownPosition(null);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]); 

  // Lógica de Filtros e Seleção (mantida)
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

  // 2. Renderização do Componente
  const DropdownContent = (
    <div 
      className="multiselect-dropdown"
      // Aplica a posição calculada, usando position: fixed do CSS
      style={dropdownPosition || {}} 
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
  );

  return (
    <div className="filter-item" ref={ref}>
      <label htmlFor={label}>{label}:</label>
      <div className="multiselect-container" style={{ position: 'relative' }}>
        <button
          id={label}
          className="filter-item-trigger"
          onClick={() => setIsOpen(!isOpen)}
          ref={triggerRef}
        >
          <span>{displayLabel}</span>
        </button>
        
        {/* Renderiza o dropdown apenas se estiver aberto e via Portal */}
        {isOpen && <FilterPortal>{DropdownContent}</FilterPortal>}
      </div>
    </div>
  );
};