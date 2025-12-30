import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAPI } from '../services/api'; 

export const useDashboard = (selectedDate) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  
  // Ref para guardar o controlador da requisição atual e poder cancelar se necessário
  const abortControllerRef = useRef(null);

  const loadData = useCallback(async () => {
    // 1. Cancela requisição anterior se houver (evita duplicação no StrictMode)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. Cria novo controlador
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const dateToSend = selectedDate || new Date().toISOString().split('T')[0];
      
      // Passamos o signal para o fetchAPI (precisa ajustar o api.js se ele não suportar, veja abaixo)
      // Se seu fetchAPI não aceitar signal, o backend ainda recebe a request, mas o front ignora a resposta antiga.
      const result = await fetchAPI(`/dashboard`, { data: dateToSend }, { signal: controller.signal });
      
      // Só atualiza o estado se o componente ainda estiver montado/ativo
      if (!controller.signal.aborted) {
        setData(result || []);
      }
    } catch (err) {
      // Ignora erro de cancelamento manual
      if (err.name === 'AbortError') return;

      console.error("Erro ao carregar dashboard:", err);
      setError("Não foi possível carregar os dados. Tente atualizar a página.");
      setData([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedDate]);

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

  useEffect(() => {
    loadData();
    fetchLastUpdate();

    // Cleanup: Cancela requisição se o usuário sair da tela ou mudar a data rápido
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData, fetchLastUpdate]);

  return { 
    data, 
    loading, 
    error, 
    refetch: () => { loadData(); fetchLastUpdate(); },
    lastUpdateTime,
    countdownTime: "" 
  };
};