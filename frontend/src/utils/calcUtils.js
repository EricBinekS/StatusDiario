// Contém funções de cálculo de tempo (Time/Adherence).

export const parseHHMMtoMinutes = (hhmmStr) => {
  if (!hhmmStr || typeof hhmmStr !== "string" || hhmmStr.includes("--"))
    return 0;
  const parts = hhmmStr.split(":");
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

export const calculateRealizedMinutes = (row, now) => {
  if (
    row.tempo_real_override === "Esp" ||
    row.tempo_real_override === "BLOCO"
  ) {
    return 0;
  }

  const startISO = row.timer_start_timestamp;
  const endISO = row.timer_end_timestamp;

  if (endISO) {
    const start = new Date(startISO);
    const end = new Date(endISO);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    let effectiveEnd = end;
    if (end < start)
      effectiveEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);

    const diffMs = effectiveEnd - start;
    if (diffMs < 0 || diffMs > 36 * 60 * 60 * 1000) return 0;

    return Math.floor(diffMs / 60000);
  }

  if (startISO) {
    const start = new Date(startISO);
    if (isNaN(start.getTime())) return 0;

    const diffMs = now - start;
    if (diffMs < 0 || diffMs > 36 * 60 * 60 * 1000) return 0;

    return Math.floor(diffMs / 60000);
  }

  return 0;
};

export const calculateAdherence = (data, now) => {
  if (!data || data.length === 0) {
    return { adherence: "0.0" };
  }

  let totalProgMinutes = 0;
  let totalRealMinutes = 0;

  data.forEach((row) => {
    totalProgMinutes += parseHHMMtoMinutes(row.tempo_prog);
    totalRealMinutes += calculateRealizedMinutes(row, now);
  });

  const adherence =
    totalProgMinutes > 0 ? (totalRealMinutes / totalProgMinutes) * 100 : 0;

  return {
    adherence: adherence.toFixed(1),
  };
};