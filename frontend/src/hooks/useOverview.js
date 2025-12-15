import { useState, useEffect, useCallback } from 'react';
import { getOverviewData } from '../services/overviewService';

export const useOverview = (viewMode) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true); // Começa carregando
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOverviewData(viewMode);
      setData(result || []);
    } catch (err) {
      console.error("Erro ao carregar overview:", err);
      setError("Não foi possível carregar os indicadores.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};