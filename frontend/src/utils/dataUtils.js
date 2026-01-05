// Utilitário para manipulação de dados e status
// Focado em PRODUÇÃO (Quantidade Real vs Programada)

const parseProduction = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const cleanValue = String(value).replace(/[^\d.-]/g, '');
  return parseFloat(cleanValue) || 0;
};

export const getDerivedStatus = (row) => {
  const s = row.status;

  // 1. Status null -> Não Iniciado (Cinza)
  if (s === null || s === undefined) return 'nao_iniciado';

  // 2. Status 0 -> Não Executado (Vermelho)
  if (s === 0) return 'cancelado';

  // 3. Status 1 -> Em Andamento (Amarelo)
  // REGRA: Status 1 é SEMPRE Amarelo, não importa a porcentagem.
  if (s === 1) return 'andamento';

  // 4. Status 2 -> Avaliação de Desempenho
  if (s === 2) {
    const progStr = row.quant?.prog ?? row.producao_prog;
    const realStr = row.quant?.real ?? row.producao_real;
    
    const prodProg = parseProduction(progStr);
    const prodReal = parseProduction(realStr);

    // Se não tiver meta programada, assume Concluído (Verde) padrão
    if (prodProg <= 0) return 'concluido';

    const ratio = prodReal / prodProg;

    // < 50% -> Não Executado (Vermelho)
    if (ratio < 0.5) return 'cancelado';

    // 50% a 90% -> Parcial (Laranja)
    if (ratio >= 0.5 && ratio < 0.9) return 'parcial';
    
    // >= 90% -> Concluído (Verde)
    return 'concluido';
  }

  // Fallback
  return 'nao_iniciado';
};