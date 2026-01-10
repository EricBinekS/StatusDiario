import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAPI } from '../services/api'; 

export const useDashboard = (selectedDate) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    setLoading(true);
    setError(null);

    try {
      const dateQuery = selectedDate || new Date().toISOString().split('T')[0];
      
      const [dashboardRes, updateRes] = await Promise.all([
        fetchAPI(`/dashboard?data=${dateQuery}`, {}, { signal }).catch(err => {
            if (err.name !== 'AbortError') throw err; 
        }),
        fetchAPI(`/last-update`, {}, { signal }).catch(err => {
             if (err.name !== 'AbortError') console.warn("Falha ao buscar last-update");
             return null;
        })
      ]);

      if (!signal.aborted) {
        if (dashboardRes) setData(dashboardRes);
        if (updateRes?.last_updated_at) setLastUpdateTime(new Date(updateRes.last_updated_at));
      }
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Erro no Dashboard:", err);
        setError("Não foi possível carregar os dados atualizados.");
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
    return () => abortControllerRef.current?.abort();
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData,
    lastUpdateTime
  };
};