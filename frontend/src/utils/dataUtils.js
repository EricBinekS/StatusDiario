/**
 * src/utils/dataUtils.js
 */

export const getDerivedStatus = (row) => {
  if (!row || !row.status) return 'nao_iniciado';
  const s = String(row.status).toUpperCase().trim();

  const map = {
    'CONCLUIDO': 'concluido',
    'PARCIAL': 'parcial',
    'ANDAMENTO': 'andamento',
    'NAO_INICIADO': 'nao_iniciado',
    'CANCELADO': 'cancelado'
  };
  return map[s] || 'nao_iniciado';
};

export const getStatusUI = (statusKey) => {
  const config = {
    concluido: { label: 'Concluído', color: 'bg-[#28a745] ring-[#28a745]', dot: 'bg-white' },
    parcial: { label: 'Parcial', color: 'bg-[#fd7e14] ring-[#fd7e14]', dot: 'bg-white' },
    andamento: { label: 'Em Andamento', color: 'bg-[#ffc107] ring-[#ffc107]', dot: 'bg-white' },
    cancelado: { label: 'Não Realizado', color: 'bg-[#ef4444] ring-[#ef4444]', dot: 'bg-white' },
    nao_iniciado: { label: 'Não Iniciado', color: 'bg-[#6c757d] ring-[#6c757d]', dot: 'bg-white' }
  };
  return config[statusKey] || config.nao_iniciado;
};

// Formatação COMPLETA (dd/MM/yyyy)
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  if (dateString.includes('-')) {
      const [y, m, d] = dateString.split('-');
      return `${d}/${m}/${y}`;
  }
  return dateString;
};

// --- NOVO: Formatação CURTA (dd/MM) ---
export const formatDateShort = (dateString) => {
  if (!dateString) return '-';
  if (dateString.includes('-')) {
      const [y, m, d] = dateString.split('-');
      return `${d}/${m}`;
  }
  return dateString;
};