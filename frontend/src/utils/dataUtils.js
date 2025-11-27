// Contém funções de manipulação de dados e status.

export const getUniqueOptions = (data, key) => {
  if (!Array.isArray(data)) return [];
  const options = new Set();
  data.forEach((row) => {
    const value = row[key];
    if (value != null && value !== "" && value !== "-" && value !== "0") {
      options.add(String(value));
    }
  });
  return Array.from(options).sort((a, b) => String(a).localeCompare(String(b)));
};

export const findUpdatedRows = (oldData, newData) => {
  const updated = new Set();
  const oldDataMap = new Map(
    oldData.map((row) => [row.row_hash, JSON.stringify(row)])
  );

  newData.forEach((newRow) => {
    const key = newRow.row_hash;
    const newSignature = JSON.stringify(newRow);
    const oldSignature = oldDataMap.get(key);
    if (!oldSignature || oldSignature !== newSignature) {
      updated.add(key);
    }
  });

  return updated;
};

export const calculateStatusDisplay = (row) => {
  const statusValue = row.status;
  const rawDate = row.data;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
        day: "2-digit",
        month: "2-digit",
      })
    : "N/A";

  let colorClass = "status-gray";
  let tooltipText = "Status não definido";

  if (statusValue === 0 || statusValue === "0")
    ((colorClass = "status-red"), (tooltipText = "Status 0 (Vermelho)"));
  else if (statusValue === 1 || statusValue === "1")
    ((colorClass = "status-yellow"), (tooltipText = "Status 1 (Amarelo)"));
  else if (statusValue === 2 || statusValue === "2")
    ((colorClass = "status-green"), (tooltipText = "Status 2 (Verde)"));
  else if (typeof statusValue === "string") {
    tooltipText = statusValue;
    const lowerStatus = statusValue.toLowerCase();
    if (lowerStatus.includes("concluído") || lowerStatus.includes("concluido"))
      colorClass = "status-green";
    else if (lowerStatus.includes("andamento")) colorClass = "status-yellow";
    else if (lowerStatus.includes("programado")) colorClass = "status-gray";
    else if (lowerStatus.includes("cancelado")) colorClass = "status-red";
  }

  return { date: formattedDate, colorClass, tooltip: tooltipText };
};

export const calculateRealTimeDisplay = (row, now) => {
    const startISO = row.timer_start_timestamp;
    const endISO = row.timer_end_timestamp;
  
    if (endISO) {
      const start = new Date(startISO);
      const end = new Date(endISO);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return "00:00";
      let effectiveEnd = end;
      if (end < start)
        effectiveEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      const diffMs = effectiveEnd - start;
      if (diffMs < 0 || diffMs > 36 * 60 * 60 * 1000) return "--:--";
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    }
  
    if (startISO) {
      const start = new Date(startISO);
      if (isNaN(start.getTime())) return "";
      const diffMs = now - start;
      if (diffMs < 0 || diffMs > 36 * 60 * 60 * 1000) return "--:--";
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      return (
        <span className="timer-running">{`${String(hours).padStart(
          2,
          "0"
        )}:${String(minutes).padStart(2, "0")}`}</span>
      );
    }
  
    return "--:--";
  };