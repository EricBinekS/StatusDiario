import { useState, useEffect, useMemo, useRef } from "react";
import { FilterPortal } from "./FilterPortal"; 

export const MultiSelectFilterPlaceholder = ({ label, options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState(null);
  
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

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
        
        if (spaceBelow < dropdownHeight && triggerRect.top > dropdownHeight) {
            position.bottom = viewportHeight - triggerRect.top;
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

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (!isOpen) return;
        const clickedOnTriggerArea = ref.current && ref.current.contains(event.target);
        const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
        if (!clickedOnTriggerArea && !clickedInsideDropdown) {
            setIsOpen(false);
        }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
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
      <label>{label}:</label>
      <div className="multiselect-container" style={{ position: 'relative' }}>
        <button
          id={label}
          className="filter-item-trigger"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          ref={triggerRef}
          type="button"
        >
          <span>{displayLabel}</span>
        </button>
        
        {isOpen && <FilterPortal>{DropdownContent}</FilterPortal>}
      </div>
    </div>
  );
};