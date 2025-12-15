import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '../services/api'; 

export const useDashboard = (selectedDate) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dateToSend = selectedDate || new Date().toISOString().split('T')[0];
      
      const result = await fetchAPI(`/dashboard`, { data: dateToSend });
      
      setData(result || []);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      setError("Não foi possível carregar os dados. Verifique a conexão.");
      setData([]); // Evita quebrar a tabela com undefined
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData };
};