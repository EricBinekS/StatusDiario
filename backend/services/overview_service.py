import pandas as pd
from sqlalchemy import text
from db.database import get_db_engine

def time_str_to_minutes(time_str):
    """Converte 'HH:MM' para minutos inteiros."""
    if not time_str or pd.isna(time_str):
        return 0
    try:
        s = str(time_str).strip()
        if ':' not in s: 
            return 0
        parts = s.split(':')
        if len(parts) >= 2:
            h, m = int(parts[0]), int(parts[1])
            return h * 60 + m
        return 0
    except:
        return 0

def get_overview_data(start_date=None, end_date=None):
    engine = get_db_engine()
    if not engine:
        return []

    # Query na tabela que já existe
    query = "SELECT * FROM atividades"
    params = {}
    
    if start_date and end_date:
        query += " WHERE data >= :start AND data <= :end"
        params = {"start": start_date, "end": end_date}
    
    try:
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn, params=params)
    except Exception as e:
        print(f"Erro ao ler banco: {e}")
        return []

    if df.empty:
        return []

    # --- Processamento dos Dados ---
    
    # 1. Converter tempos para minutos
    df['minutos_prog'] = df['tempo_prog'].apply(time_str_to_minutes)
    df['minutos_real'] = df['tempo_real'].apply(time_str_to_minutes)

    # 2. Definir se foi realizado (tem inicio real e não é 00:00)
    df['foi_realizado'] = df['inicio_real'].notna() & (df['inicio_real'] != '') & (df['inicio_real'] != '00:00')

    # 3. Normalizar Nomes das Gerências (Para bater com os IDs do Front)
    def normalizar_gerencia(g):
        g = str(g).upper()
        if 'FERRONORTE' in g: return 'ferronorte', 'Ferronorte'
        if 'SP NORTE' in g or 'MALHA PAULISTA' in g: return 'sp_norte', 'SP Norte'
        if 'SP SUL' in g or 'MALHA SUL' in g: return 'sp_sul', 'SP Sul'
        if 'CENTRAL' in g: return 'central', 'Malha Central'
        if 'MODERNIZA' in g: return 'modernizacao', 'Modernização'
        if 'MECANIZA' in g: return 'mecanizacao', 'Mecanização'
        return 'outros', g.title() if g != 'NAN' else 'Outros'

    df[['gerencia_id', 'gerencia_label']] = df['gerencia_da_via'].apply(
        lambda x: pd.Series(normalizar_gerencia(x))
    )

    # 4. Normalizar Tipo (Contrato vs Oportunidade)
    df['tipo_norm'] = df['tipo'].apply(
        lambda x: 'contrato' if x and 'CONTRATO' in str(x).upper() else 'oportunidade'
    )

    # 5. Agrupar e Somar
    grouped = df.groupby(['gerencia_id', 'gerencia_label', 'tipo_norm']).agg(
        total_int_prog=('row_hash', 'count'),
        total_int_real=('foi_realizado', 'sum'),
        total_min_prog=('minutos_prog', 'sum'),
        total_min_real=('minutos_real', 'sum')
    ).reset_index()

    # 6. Montar JSON
    output_data = {}
    
    # IDs fixos para garantir que os cards apareçam mesmo sem dados
    ids_esperados = ['ferronorte', 'sp_norte', 'sp_sul', 'central', 'modernizacao', 'mecanizacao']
    labels_esperados = ['Ferronorte', 'SP Norte', 'SP Sul', 'Malha Central', 'Modernização', 'Mecanização']
    
    for gid, glabel in zip(ids_esperados, labels_esperados):
        output_data[gid] = {
            "id": gid, "title": glabel,
            "types": { "contrato": _empty_stats(), "oportunidade": _empty_stats() }
        }

    for _, row in grouped.iterrows():
        g_id = row['gerencia_id']
        if g_id not in output_data: continue

        tipo = row['tipo_norm']
        stats = output_data[g_id]["types"][tipo]

        # Preenche KPIs
        stats["kpis"]["prog_int"] = int(row['total_int_prog'])
        stats["kpis"]["real_int"] = int(row['total_int_real'])
        stats["kpis"]["prog_h"] = round(row['total_min_prog'] / 60, 1)
        stats["kpis"]["real_h"] = round(row['total_min_real'] / 60, 1)

        # Calcula Porcentagem
        if stats["kpis"]["prog_int"] > 0:
            stats["percentual"] = int((stats["kpis"]["real_int"] / stats["kpis"]["prog_int"]) * 100)
        
    return list(output_data.values())

def _empty_stats():
    return {
        "percentual": 0, "meta": 85,
        "kpis": {"prog_int": 0, "real_int": 0, "prog_h": 0, "real_h": 0},
        "chartData": [] # Futuramente podemos popular isso
    }