import { useState, useEffect, useMemo, useRef } from "react";
import { FilterPortal } from "./FilterPortal"; 

// Adicionado prop containerStyle para customização externa
export const MultiSelectFilterPlaceholder = ({ label, options, selectedValues, onChange, containerStyle = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState(null);
  
  const ref = useRef(null); 
  const triggerRef = useRef(null); 
  const dropdownRef = useRef(null); 

  // --- Lógica de Posicionamento (Ajustada para Mobile) ---
  useEffect(() => {
    if (isOpen && triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Se for mobile, ignoramos a posição do botão e fixamos na tela
        const isMobile = viewportWidth <= 768;

        if (isMobile) {
            setDropdownPosition({
                position: 'fixed',
                top: 'auto',
                bottom: '0',
                left: '0',
                right: '0',
                width: '100%',
                maxWidth: '100%',
                maxHeight: '60vh', // Ocupa até 60% da tela no max
                borderRadius: '12px 12px 0 0', // Arredonda só em cima
                borderTop: '1px solid #ccc',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.2)'
            });
        } else {
            // Lógica Desktop (Mantida e refinada)
            const dropdownHeight = 250; 
            const spaceBelow = viewportHeight - triggerRect.bottom;
            
            let position = {
                position: 'absolute', // Importante para o Portal funcionar com coords absolutas
                minWidth: triggerRect.width,  
                width: 'max-content',         
                maxWidth: '300px',             
                left: triggerRect.left + window.scrollX, // Adiciona scrollX para garantir precisão
            };
            
            // Verifica se vai sair da tela pela direita
            if (triggerRect.left + 300 > viewportWidth) {
                position.left = 'auto';
                position.right = 20; // Margem de segurança da direita
            }

            if (spaceBelow < dropdownHeight && triggerRect.top > dropdownHeight) {
                position.top = (triggerRect.top + window.scrollY) - dropdownHeight; // Abre para cima
                // Nota: para abrir para cima funcionar perfeitamente com altura dinâmica, 
                // idealmente precisariamos medir o dropdown antes. 
                // Mas fixar bottom relative ao viewport ajuda:
                position.top = 'auto';
                position.bottom = viewportHeight - triggerRect.top;
            } else {
                position.top = triggerRect.bottom + window.scrollY;
                position.bottom = 'auto';
            }
            
            setDropdownPosition(position);
        }
    } else {
        setDropdownPosition(null);
    }
  }, [isOpen]); 

  // --- Lógica de Click Outside (Corrigida para Mobile) ---
  useEffect(() => {
    const handleOutsideInteraction = (event) => {
        if (!isOpen) return;

        // Verifica se o alvo do evento está dentro do ref do componente ou do dropdown
        const clickedOnTriggerArea = ref.current && ref.current.contains(event.target);
        const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);

        if (!clickedOnTriggerArea && !clickedInsideDropdown) {
            setIsOpen(false);
        }
    };
    
    // Adiciona listener para mousedown (Desktop) e touchstart (Mobile)
    document.addEventListener("mousedown", handleOutsideInteraction);
    document.addEventListener("touchstart", handleOutsideInteraction);

    return () => {
        document.removeEventListener("mousedown", handleOutsideInteraction);
        document.removeEventListener("touchstart", handleOutsideInteraction);
    };
  }, [isOpen]);

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

  const DropdownContent = (
    <div 
      ref={dropdownRef} 
      className="multiselect-dropdown"
      style={dropdownPosition || {}} 
      // Stop propagation para evitar fechar ao clicar dentro
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="search-input-container">
        <input 
          type="text" 
          placeholder="Pesquisar..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus={!dropdownPosition?.bottom} // Autofocus só se não for mobile (opcional)
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
          <div style={{ padding: '8px', color: 'var(--cor-texto-secundario)', textAlign: 'center' }}>
            Nenhuma opção.
          </div>
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
    <div className="filter-item" ref={ref} style={containerStyle}>
      <label htmlFor={label}>{label}:</label>
      <div className="multiselect-container" style={{ position: 'relative' }}>
        <button
          id={label}
          className="filter-item-trigger"
          type="button" // Importante para evitar submit de forms acidental
          onClick={(e) => {
            e.stopPropagation(); // Previne que o click suba
            setIsOpen(!isOpen);
          }}
          ref={triggerRef}
        >
          <span>{displayLabel}</span>
        </button>
        
        {isOpen && <FilterPortal>{DropdownContent}</FilterPortal>}
      </div>
    </div>
  );
};