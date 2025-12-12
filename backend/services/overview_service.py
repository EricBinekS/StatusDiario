import pandas as pd
from sqlalchemy import text
from db.database import get_db_engine

# --- CONSTANTES ---
ATIVIDADES_MECANIZACAO = [
    "MECANIZAÇÃO - CAPINA QUÍMICA", "MECANIZAÇÃO - DOL", 
    "MECANIZAÇÃO - ESMERILHADORA", "MECANIZAÇÃO - MANUTENÇÃO", 
    "MECANIZAÇÃO - SOCADORA"
]
ATIVIDADES_MECANIZACAO = [x.strip().upper() for x in ATIVIDADES_MECANIZACAO]

def time_str_to_minutes(time_str):
    if not time_str or pd.isna(time_str): return 0
    try:
        s = str(time_str).strip()
        if ':' not in s: return 0
        h, m = map(int, s.split(':')[:2])
        return h * 60 + m
    except: return 0

def _get_chart_data(df, view_mode):
    chart_data = []
    if df.empty: return chart_data

    df['data_dt'] = pd.to_datetime(df['data'])

    if view_mode == 'semana':
        days_map = {0: 'Seg', 1: 'Ter', 2: 'Qua', 3: 'Qui', 4: 'Sex', 5: 'Sáb', 6: 'Dom'}
        df['day_of_week'] = df['data_dt'].dt.dayofweek
        grouped = df.groupby('day_of_week')
        
        for i in range(7):
            grp = grouped.get_group(i) if i in grouped.groups else pd.DataFrame()
            chart_data.append({
                "name": days_map[i],
                "prog": len(grp),
                "real": int(grp['foi_realizado'].sum()) if not grp.empty else 0
            })

    elif view_mode == 'mes':
        df['week_num'] = df['data_dt'].dt.isocalendar().week
        grouped = df.groupby('week_num')
        sorted_weeks = sorted(list(grouped.groups.keys()))
        
        for w_num in sorted_weeks:
            grp = grouped.get_group(w_num)
            chart_data.append({
                "name": f"Sem {w_num}",
                "prog": len(grp),
                "real": int(grp['foi_realizado'].sum())
            })

    return chart_data

def get_overview_data(start_date=None, end_date=None, view_mode='semana'):
    engine = get_db_engine()
    if not engine:
        print("Erro: Engine de banco de dados não disponível.")
        return []

    # Query Base
    query_str = "SELECT * FROM atividades"
    params = {}
    
    if start_date and end_date:
        query_str += " WHERE data >= :start AND data <= :end"
        params = {"start": start_date, "end": end_date}
    
    try:
        # USO CORRETO DO ENGINE AQUI
        with engine.connect() as conn:
            df = pd.read_sql(text(query_str), conn, params=params)
    except Exception as e:
        print(f"Erro ao ler banco de dados: {e}")
        return []

    if df.empty: return []

    # --- Processamento ---
    df['minutos_prog'] = df['tempo_prog'].apply(time_str_to_minutes)
    df['minutos_real'] = df['tempo_real'].apply(time_str_to_minutes)
    df['foi_realizado'] = df['inicio_real'].notna() & (df['inicio_real'] != '') & (df['inicio_real'] != '00:00')

    coluna_gerencia = 'gerência_da_via' if 'gerência_da_via' in df.columns else 'gerencia_da_via'

    def normalizar_gerencia(g):
        g = str(g).upper()
        if 'FERRONORTE' in g: return 'ferronorte', 'Ferronorte'
        if 'SP NORTE' in g or 'MALHA PAULISTA' in g: return 'sp_norte', 'SP Norte'
        if 'SP SUL' in g or 'MALHA SUL' in g: return 'sp_sul', 'SP Sul'
        if 'CENTRAL' in g: return 'central', 'Malha Central'
        if 'MODERNIZA' in g: return 'modernizacao', 'Modernização'
        return 'outros', g.title() if g != 'NAN' else 'Outros'

    df[['gerencia_id', 'gerencia_label']] = df[coluna_gerencia].apply(lambda x: pd.Series(normalizar_gerencia(x)))
    
    df['tipo_norm'] = df['tipo'].apply(lambda x: 'contrato' if x and 'CONTRATO' in str(x).upper() else 'oportunidade')

    # Agrupamento
    grouped = df.groupby(['gerencia_id', 'gerencia_label', 'tipo_norm']).agg(
        total_int_prog=('row_hash', 'count'),
        total_int_real=('foi_realizado', 'sum'),
        total_min_prog=('minutos_prog', 'sum'),
        total_min_real=('minutos_real', 'sum')
    ).reset_index()

    # Separação Mecanização
    df_mecanizacao = pd.DataFrame()
    if 'atividade' in df.columns:
        mask_mec = df['atividade'].astype(str).str.strip().str.upper().isin(ATIVIDADES_MECANIZACAO)
        df_mecanizacao = df[mask_mec].copy()

    # Estrutura JSON
    output_data = {}
    setup_keys = [
        ('ferronorte', 'Ferronorte'), ('sp_norte', 'SP Norte'), 
        ('sp_sul', 'SP Sul'), ('central', 'Malha Central'), 
        ('modernizacao', 'Modernização'), ('mecanizacao', 'Mecanização')
    ]
    
    for gid, glabel in setup_keys:
        output_data[gid] = {
            "id": gid, "title": glabel,
            "types": { "contrato": _empty_stats(), "oportunidade": _empty_stats() }
        }

    # Preencher Gerências
    for _, row in grouped.iterrows():
        g_id = row['gerencia_id']
        if g_id not in output_data or g_id == 'mecanizacao': continue

        _fill_stats(output_data[g_id], row, df, view_mode)

    # Preencher Mecanização
    if not df_mecanizacao.empty:
        mec_grouped = df_mecanizacao.groupby('tipo_norm').agg(
            total_int_prog=('row_hash', 'count'),
            total_int_real=('foi_realizado', 'sum'),
            total_min_prog=('minutos_prog', 'sum'),
            total_min_real=('minutos_real', 'sum')
        ).reset_index()
        
        mec_grouped['gerencia_id'] = 'mecanizacao' # Fake ID para usar a mesma função
        for _, row in mec_grouped.iterrows():
            _fill_stats(output_data['mecanizacao'], row, df_mecanizacao, view_mode)

    return list(output_data.values())

def _fill_stats(target_obj, row, dataframe, view_mode):
    tipo = row['tipo_norm']
    stats = target_obj["types"][tipo]

    stats["kpis"]["prog_int"] = int(row['total_int_prog'])
    stats["kpis"]["real_int"] = int(row['total_int_real'])
    stats["kpis"]["prog_h"] = round(row['total_min_prog'] / 60, 1)
    stats["kpis"]["real_h"] = round(row['total_min_real'] / 60, 1)

    if stats["kpis"]["prog_int"] > 0:
        stats["percentual"] = int((stats["kpis"]["real_int"] / stats["kpis"]["prog_int"]) * 100)

    # Filtra dados para o gráfico deste grupo específico
    if row['gerencia_id'] == 'mecanizacao':
         mask = (dataframe['tipo_norm'] == tipo)
    else:
         mask = (dataframe['gerencia_id'] == row['gerencia_id']) & (dataframe['tipo_norm'] == tipo)
         
    stats["chartData"] = _get_chart_data(dataframe[mask].copy(), view_mode)

def _empty_stats():
    return {
        "percentual": 0, "meta": 85,
        "kpis": {"prog_int": 0, "real_int": 0, "prog_h": 0, "real_h": 0},
        "chartData": []
    }