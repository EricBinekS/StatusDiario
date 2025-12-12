import pandas as pd
from sqlalchemy import text
from db.connection import get_db_engine

def get_dashboard_data(filters=None):
    """
    Retorna os dados operacionais para a Tabela.
    Isolado de qualquer lógica de gráfico.
    """
    engine = get_db_engine()
    if not engine:
        return []

    # Query Base - Pega tudo dos últimos 31 dias (já filtrado no ETL, mas reforçamos)
    # A ordenação é importante para a tabela: Data desc, Início asc
    query = """
        SELECT 
            row_hash, status, gerencia_da_via, ativo, atividade, 
            tipo, data, inicio_prog, inicio_real, fim_prog, fim_real,
            local_prog, local_real
        FROM atividades
        ORDER BY data DESC, inicio_prog ASC
    """
    
    try:
        with engine.connect() as conn:
            # Pandas é ótimo para converter SQL -> JSON (Lista de Dicionários)
            df = pd.read_sql(text(query), conn)
        
        if df.empty:
            return []

        # Tratamento Final para Frontend (evitar nulls que quebram React)
        df = df.fillna("")
        
        # Converte datas para string ISO se necessário (o Pandas faz automático no to_dict, mas bom garantir)
        # Opcional: Aplicar filtros de servidor aqui se o volume crescer muito.
        
        return df.to_dict(orient="records")

    except Exception as e:
        print(f"🔴 Erro no DashboardService: {e}")
        return [] # Retorna lista vazia para não quebrar o front