import { useState, useEffect, useMemo, useRef } from "react";
import { FilterPortal } from "./FilterPortal"; 

export const MultiSelectFilterPlaceholder = ({ label, options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState(null);
  
  // Refs para verificar os alvos do clique
  const ref = useRef(null); // 1. Ref para o wrapper do filtro (.filter-item)
  const triggerRef = useRef(null); // Ref para o botão
  const dropdownRef = useRef(null); // 2. Ref para o conteúdo do Popup (dentro do Portal)

  // 1. Lógica de cálculo de posição (abrir para cima ou para baixo)
  useEffect(() => {
    if (isOpen && triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 250; 
        const spaceBelow = viewportHeight - triggerRect.bottom;
        
        let position = {
            width: triggerRect.width,
            left: triggerRect.left,
        };
        
        // Condição: Abrir para cima se o espaço abaixo for menor que a altura do dropdown
        // E se houver espaço suficiente acima.
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
  }, [isOpen]); 

  // 2. Lógica de Fechamento ao Clicar Fora (O FIX)
  useEffect(() => {
    const handleClickOutside = (event) => {
        // Se o dropdown não estiver aberto, não faz nada.
        if (!isOpen) return;

        // 1. Verifica se o clique foi na área principal do filtro (rótulo, botão)
        const clickedOnTriggerArea = ref.current && ref.current.contains(event.target);
        
        // 2. Verifica se o clique foi DENTRO do conteúdo do popup (que está no body)
        const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);

        // Fecha SOMENTE se o clique NÃO estiver em 1 E NÃO estiver em 2.
        if (!clickedOnTriggerArea && !clickedInsideDropdown) {
            setIsOpen(false);
        }
    };
    
    // Adiciona o listener ao documento.
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]); // O listener precisa saber quando o estado isOpen muda

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

  // 2. Renderização do Conteúdo do Popup (anexando o ref)
  const DropdownContent = (
    <div 
      ref={dropdownRef} // *** ATTACH REF AO CONTEÚDO DO PORTAL ***
      className="multiselect-dropdown"
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
        
        {/* Renderiza via Portal */}
        {isOpen && <FilterPortal>{DropdownContent}</FilterPortal>}
      </div>
    </div>
  );
};