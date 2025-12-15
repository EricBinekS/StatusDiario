import { useState, useEffect, useCallback } from 'react';
import { getDashboardData } from '../services/dashboardService';

export const useDashboard = (selectedDate) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Se não tiver data selecionada, usa hoje formatado YYYY-MM-DD
      const dateToSend = selectedDate || new Date().toISOString().split('T')[0];
      
      const result = await getDashboardData(dateToSend);
      setData(result || []);
    } catch (err) {
      console.error("Erro no hook useDashboard:", err);
      setError(err.message);
      setData([]); // Garante array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData };
};