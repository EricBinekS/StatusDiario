import { useState, useEffect, useCallback } from 'react';
import { getOverviewData } from '../services/overviewService';

export const useOverview = (viewMode) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOverviewData(viewMode);
      setData(Array.isArray(result) ? result : []);
      setError(null);
    } catch (err) {
      console.error("Overview Error:", err);
      setError("Falha ao carregar indicadores gerenciais.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 300000); 
    return () => clearInterval(interval);
  }, [loadData]);

  return { data, loading, error, refetch: loadData };
};