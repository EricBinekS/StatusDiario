import { useState, useEffect } from "react";
import { getTodaysDateStringForApi } from "../utils/dateUtils";

// URL da API (Ajuste se necessário para o seu ambiente)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const useFetchData = () => {
  const [rawData, setRawData] = useState([]);
  const [updatedRows, setUpdatedRows] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Busca dados do dia atual
        const dateStr = getTodaysDateStringForApi();
        const response = await fetch(`${API_URL}/api/atividades?data=${dateStr}`);
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }

        const jsonResponse = await response.json();

        // CORREÇÃO AQUI: Acessamos jsonResponse.data, pois a API retorna { data: [...], last_updated: ... }
        const dataList = jsonResponse.data || []; 
        
        // CORREÇÃO CRÍTICA DE DUPLICIDADE (UID)
        const dataWithUniqueIds = Array.isArray(dataList) 
          ? dataList.map((row, index) => ({
              ...row,
              // Se houver colisão de hash, o index garante a unicidade
              frontend_uid: `${row.row_hash || 'unknown'}-${index}`
            }))
          : [];

        setRawData(dataWithUniqueIds);
        
        // Atualiza o timestamp com o que veio da API ou usa o momento atual
        const apiTimestamp = jsonResponse.last_updated ? new Date(jsonResponse.last_updated) : new Date();
        setLastUpdatedTimestamp(apiTimestamp);
        
        setError(null);
        
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Busca inicial
    fetchData();

    // Polling a cada 30 segundos
    const intervalId = setInterval(fetchData, 30000);

    return () => clearInterval(intervalId);
  }, []);

  return { rawData, updatedRows, loading, lastUpdatedTimestamp, error };
};