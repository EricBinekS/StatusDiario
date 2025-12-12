import { useState, useEffect, useCallback } from 'react';
import { getDashboardData } from '../services/dashboardService';

export const useDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDashboardData();
      setData(result || []);
      setError(null);
    } catch (err) {
      console.error("Dashboard Error:", err);
      setError("Falha ao carregar dados operacionais.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData };
};