import { useState, useEffect, useCallback } from "react";

export const useFetchOverview = (filters) => {
  const [overviewData, setOverviewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      // Monta a URL com os parametros (startDate, endDate, viewMode)
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.viewMode) queryParams.append("viewMode", filters.viewMode);

      const url = `${import.meta.env.VITE_API_URL}/api/overview?${queryParams.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      
      const jsonData = await response.json();
      setOverviewData(jsonData || []);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar overview:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]); // Recarrega sempre que os filtros mudarem

  useEffect(() => {
    fetchOverview();
    
    // Atualiza a cada 5 minutos automaticamente
    const intervalId = setInterval(fetchOverview, 300000);
    return () => clearInterval(intervalId);
  }, [fetchOverview]);

  return { overviewData, loading, error, refetch: fetchOverview };
};