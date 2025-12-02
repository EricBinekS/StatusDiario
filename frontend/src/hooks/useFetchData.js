import { useState, useEffect } from "react";
import { getTodaysDateStringForApi } from "../utils/dateUtils";

// CUIDADO COM ALTERAÇÕES NESSE CÓDIGO PARA MANTER A ATUALIZAÇÃO INVISIVEL, EXECUTIVOS NÃO GOSTAM DA TELA PISCANTE!!!

// URL da API
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const useFetchData = () => {
  const [rawData, setRawData] = useState([]);
  const [updatedRows, setUpdatedRows] = useState(new Set());
  // Começa como true para mostrar o loading na primeira carga da página
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState(null);

  useEffect(() => {
    // Variável para evitar atualização de estado se o componente desmontar
    let isMounted = true;

    const fetchData = async (isBackgroundUpdate = false) => {
      try {
        // Só ativamos o loading visual se NÃO for uma atualização de fundo
        if (!isBackgroundUpdate) {
          setLoading(true);
        }

        const dateStr = getTodaysDateStringForApi();
        const response = await fetch(`${API_URL}/api/atividades?data=${dateStr}`);
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }

        const jsonResponse = await response.json();
        const dataList = jsonResponse.data || []; 
        
        // Geração de ID único
        const dataWithUniqueIds = Array.isArray(dataList) 
          ? dataList.map((row, index) => ({
              ...row,
              frontend_uid: `${row.row_hash || 'unknown'}-${index}`
            }))
          : [];

        if (isMounted) {
          setRawData(dataWithUniqueIds);
          
          const apiTimestamp = jsonResponse.last_updated ? new Date(jsonResponse.last_updated) : new Date();
          setLastUpdatedTimestamp(apiTimestamp);
          setError(null);
        }
        
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        if (isMounted) setError(err.message);
      } finally {
        // Sempre desliga o loading, independente se foi background ou não
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // 1. Busca inicial (Mostra Loading)
    fetchData(false);

    // 2. Polling a cada 30 segundos (NÃO mostra Loading, atualização silenciosa)
    const intervalId = setInterval(() => {
        fetchData(true); 
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { rawData, updatedRows, loading, lastUpdatedTimestamp, error };
};