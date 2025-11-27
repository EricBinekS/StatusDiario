import { useState, useMemo } from "react";

export const useSorting = (data) => {
  const [sortConfig, setSortConfig] = useState({
    key: "status",
    direction: "descending",
  });

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

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    if (!sortConfig.key) return data;

    // A CORREÇÃO: Cria uma cópia rasa do array antes de ordenar (evita mutação)
    const sortableData = [...data]; 

    sortableData.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
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

      return sortConfig.direction === "ascending" ? comparison : comparison * -1;
    });

    // Retorna o array copiado e ordenado, que é o estado limpo
    return sortableData; 
  }, [data, sortConfig]);

  return { sortedData, requestSort, getSortDirectionClass };
};