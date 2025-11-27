import { useState, useEffect } from "react";

export const useTimer = (lastUpdatedTimestamp) => {
  const [now, setNow] = useState(new Date());
  const [nextUpdateIn, setNextUpdateIn] = useState("Calculando...");

  useEffect(() => {
    const timerNowId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerNowId);
  }, []);

  useEffect(() => {
    if (lastUpdatedTimestamp) {
      const UPDATE_INTERVAL_MS = 10 * 60 * 1000;
      const nextUpdateTimestamp = lastUpdatedTimestamp.getTime() + UPDATE_INTERVAL_MS;
      const diffMs = nextUpdateTimestamp - now.getTime();

      if (diffMs <= 0) {
        setNextUpdateIn("Atualizando...");
      } else {
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        setNextUpdateIn(
          `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
            2,
            "0"
          )}`
        );
      }
    } else {
      setNextUpdateIn("Aguardando dados...");
    }
  }, [now, lastUpdatedTimestamp]);

  return { now, nextUpdateIn };
};