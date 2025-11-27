import { useState, useEffect, useRef } from "react";
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
      const url = `${import.meta.env.VITE_API_URL}/api/atividades`;
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const responseData = await response.json();
      const jsonData = responseData.data || [];
      const timestamp = responseData.last_updated;

      if (previousDataRef.current.length > 0) {
        const changes = findUpdatedRows(previousDataRef.current, jsonData);
        if (changes.size > 0) {
          setUpdatedRows(changes);
          setTimeout(() => setUpdatedRows(new Set()), 2000);
        }
      }

      setRawData(jsonData);
      previousDataRef.current = jsonData;
      if (timestamp) setLastUpdatedTimestamp(new Date(timestamp));
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      setRawData([]);
      setLastUpdatedTimestamp(null);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timerFetchId = setInterval(fetchData, 600000);
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