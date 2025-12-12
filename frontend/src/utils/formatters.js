export const normalizeText = (text) => {
  if (!text) return '';
  return String(text).toUpperCase().trim();
};

export const getStatusColor = (status) => {
  const s = normalizeText(status);
  if (s === 'CONCLUIDO' || s === 'CONCLUÍDO') return 'bg-green-100 text-green-800 border-green-200';
  if (s === 'EM ANDAMENTO') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (s === 'PROGRAMADO') return 'bg-gray-100 text-gray-800 border-gray-200';
  if (s === 'CANCELADO') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-50 text-gray-600 border-gray-200';
};