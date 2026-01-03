// Utilitário para manipulação de dados e status
// Focado em PRODUÇÃO (Quantidade Real vs Programada)

// Helper para converter valores de produção em números
const parseProduction = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  // Remove caracteres não numéricos se necessário, mas mantém ponto decimal
  const cleanValue = String(value).replace(/[^\d.-]/g, '');
  return parseFloat(cleanValue) || 0;
};

// Determina o status lógico com base nas regras de Negócio
// Base: Produção (Quantidades)
export const getDerivedStatus = (row) => {
  const s = row.status;

  // 1. Status null -> Não Iniciado
  if (s === null || s === undefined) return 'nao_iniciado';

  // 2. Status 0 -> Não Executado
  if (s === 0) return 'cancelado';

  // Preparar cálculo de porcentagem de Produção
  // Tenta ler de row.quant (estrutura do frontend) ou row.producao (estrutura do banco)
  const progStr = row.quant?.prog ?? row.producao_prog;
  const realStr = row.quant?.real ?? row.producao_real;
  
  const prodProg = parseProduction(progStr);
  const prodReal = parseProduction(realStr);

  let ratio = 0;
  if (prodProg > 0) {
    ratio = prodReal / prodProg;
  }

  // 3. Abaixo de 50% de execução -> Não Executado (Independente do status ser 1 ou 2)
  if (ratio < 0.5) return 'cancelado';

  // 4. Status 1 -> Em Andamento (Se chegou aqui, já é >= 50%)
  if (s === 1) return 'andamento';

  // 5. Status 2
  if (s === 2) {
    // Executou entre 50% e 90% -> Parcial
    if (ratio >= 0.5 && ratio < 0.9) return 'parcial';
    
    // Executou acima de 90% -> Concluído
    if (ratio >= 0.9) return 'concluido';
  }

  // Fallback (caso sobre algo não mapeado, assume andamento ou concluído dependendo do contexto)
  return 'andamento';
};