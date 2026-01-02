export const parseTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  if (timeStr.includes('--')) return 0;
  
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;

  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

export const getDerivedStatus = (row) => {
  const s = row.status;

  // 1. Não Iniciado
  if (s === null || s === undefined) return 'nao_iniciado';

  // 2. Concluído (Pelo Status do Banco)
  if (s === 2) return 'concluido';

  // 3. Cancelado (Pelo Status do Banco)
  if (s === 0) return 'cancelado';

  // 4. Lógica de Porcentagem para Status 1
  if (row.tempo && row.tempo.prog && row.tempo.real) {
    const progMin = parseTime(row.tempo.prog);
    const realMin = parseTime(row.tempo.real);

    if (progMin > 0) {
      const ratio = realMin / progMin;

      // < 50% -> Cancelado (Não Realizado)
      if (ratio < 0.5) return 'cancelado';

      // >= 50% e < 90% -> Parcial
      if (ratio >= 0.5 && ratio < 0.9) return 'parcial';

      // >= 90% -> Concluído (Executado)
      if (ratio >= 0.9) return 'concluido';
    }
  }

  // 5. Em Andamento
  // (Status 1 mas sem dados de tempo suficientes para calcular %)
  return 'andamento';
};