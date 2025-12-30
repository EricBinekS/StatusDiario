import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAPI } from '../services/api';

export const useOverview = (viewMode = 'semana') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ref para o AbortController
  const abortControllerRef = useRef(null);

  const loadData = useCallback(async () => {
    // 1. Cancela requisição anterior pendente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. Cria novo controlador
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      // Passa o sinal para a API
      const result = await fetchAPI(`/overview`, { view: viewMode }, { signal: controller.signal });
      
      if (!controller.signal.aborted) {
        setData(result || []);
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // Ignora cancelamento intencional

      console.error("Erro ao carregar overview:", err);
      setError("Falha ao carregar dados.");
      setData([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [viewMode]);

  useEffect(() => {
    loadData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  return { data, loading, error, refetch: loadData };
};