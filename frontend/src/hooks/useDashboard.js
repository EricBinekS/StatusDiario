import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '../services/api'; 

export const useDashboard = (selectedDate) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // 1. Função que busca os dados da tabela
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
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // 2. Função auxiliar para pegar a data da última atualização (apenas informativo)
  const fetchLastUpdate = useCallback(async () => {
    try {
      const result = await fetchAPI(`/last-update`);
      if (result && result.last_updated_at) {
        setLastUpdateTime(new Date(result.last_updated_at));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Efeito Único: Carrega dados ao montar ou mudar a data do filtro
  useEffect(() => {
    loadData();
    fetchLastUpdate();
  }, [loadData, fetchLastUpdate]);

  return { 
    data, 
    loading, 
    error, 
    refetch: () => { loadData(); fetchLastUpdate(); }, // Recarga manual continua funcionando
    lastUpdateTime,
    countdownTime: "" // Retornamos vazio para não quebrar o código se a página ainda tentar ler isso
  };
};