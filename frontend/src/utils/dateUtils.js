// Contém funções de formatação de data e tempo.

export const getTodaysDateStringForReact = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const formatLastUpdated = (timestamp, loading) => {
  if (loading && !timestamp) return "Carregando...";
  if (!timestamp) return "N/D";
  try {
    return new Date(timestamp).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return "Data inválida";
  }
};