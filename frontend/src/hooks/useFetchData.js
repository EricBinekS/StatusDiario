import { useState, useEffect, useRef } from "react";
// Se utils/dataUtils não existir ou for diferente, ajuste o import
import { findUpdatedRows } from "../utils/dataUtils"; 

export const useFetchData = () => {
  const [rawData, setRawData] = useState([]);
  const [updatedRows, setUpdatedRows] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState(null);
  const [error, setError] = useState(null);
  const previousDataRef = useRef([]);

  const fetchData = async () => {
    try {
      // setLoading(true); // Opcional: Evita piscar a tela se já tem dados
      const url = `${import.meta.env.VITE_API_URL}/api/atividades`;
      const response = await fetch(url);
      
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      
      const responseData = await response.json();
      
      // Garante que jsonData seja um array mesmo se a API falhar
      const jsonData = Array.isArray(responseData.data) ? responseData.data : [];
      const timestamp = responseData.last_updated;

      // Lógica de linhas atualizadas
      if (previousDataRef.current.length > 0 && jsonData.length > 0) {
        // Verifica se a função existe antes de chamar
        if (typeof findUpdatedRows === 'function') {
            const changes = findUpdatedRows(previousDataRef.current, jsonData);
            if (changes.size > 0) {
                setUpdatedRows(changes);
                setTimeout(() => setUpdatedRows(new Set()), 2000);
            }
        }
      }

      setRawData(jsonData);
      previousDataRef.current = jsonData;
      if (timestamp) setLastUpdatedTimestamp(new Date(timestamp));
      setError(null); // Limpa erro se tiver sucesso

    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      // Não zeramos rawData em caso de erro para manter os dados antigos visíveis
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timerFetchId = setInterval(fetchData, 60000); // 60s é mais seguro que 10min (600000)
    return () => clearInterval(timerFetchId);
  }, []);

  return {
    rawData,
    updatedRows,
    loading,
    error,
    lastUpdatedTimestamp,
    fetchData,
  };
};