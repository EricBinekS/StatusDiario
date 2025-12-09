import { useState, useEffect } from "react";
import { getTodaysDateStringForApi } from "../utils/dateUtils";

// CUIDADO COM ALTERAÇÕES NESSE CÓDIGO PARA MANTER A ATUALIZAÇÃO INVISIVEL, EXECUTIVOS NÃO GOSTAM DA TELA PISCANTE!!!

// URL da API
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const useFetchData = () => {
  const [rawData, setRawData] = useState([]);
  const [overviewData, setOverviewData] = useState([]); // <--- NOVO ESTADO
  const [updatedRows, setUpdatedRows] = useState(new Set());
  
  // Começa como true para mostrar o loading SOMENTE na primeira carga da página
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState(null);

  useEffect(() => {
    // Variável para evitar atualização de estado se o componente desmontar
    let isMounted = true;

    const fetchData = async (isBackgroundUpdate = false) => {
      try {
        // LÓGICA CRÍTICA: Só ativamos o loading visual se NÃO for uma atualização de fundo
        if (!isBackgroundUpdate) {
          setLoading(true);
        }

        const dateStr = getTodaysDateStringForApi();

        // Faz as duas requisições em paralelo (mais rápido)
        const [resAtividades, resOverview] = await Promise.all([
            fetch(`${API_URL}/api/atividades?data=${dateStr}`),
            fetch(`${API_URL}/api/overview?start_date=${dateStr}&end_date=${dateStr}`)
        ]);
        
        if (!resAtividades.ok) {
          throw new Error(`Erro na API Atividades: ${resAtividades.status}`);
        }

        // Processa Atividades (Painel)
        const jsonAtividades = await resAtividades.json();
        const dataList = jsonAtividades.data || []; 
        
        // Processa Overview (Se falhar, não quebra o painel, retorna array vazio)
        const jsonOverview = resOverview.ok ? await resOverview.json() : [];

        // Geração de ID único (Mantido do seu original)
        const dataWithUniqueIds = Array.isArray(dataList) 
          ? dataList.map((row, index) => ({
              ...row,
              frontend_uid: `${row.row_hash || 'unknown'}-${index}`
            }))
          : [];

        if (isMounted) {
          setRawData(dataWithUniqueIds);
          setOverviewData(jsonOverview); // <--- Atualiza o Overview silenciosamente
          
          const apiTimestamp = jsonAtividades.last_updated ? new Date(jsonAtividades.last_updated) : new Date();
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

    // 1. Busca inicial (Mostra Loading, isBackgroundUpdate = false)
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

  // Retornamos overviewData agora
  return { rawData, overviewData, updatedRows, loading, lastUpdatedTimestamp, error };
};