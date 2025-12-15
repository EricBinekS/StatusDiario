import pandas as pd
from datetime import datetime, timedelta, time
from sqlalchemy import text
from backend.db.connection import get_db_engine

# --- CONFIGURAÇÃO ---
ATIVIDADES_MECANIZACAO = [
    "MECANIZACAO", "MECANIZAÇÃO", "SOCADORA", "REGULADORA", "ESMERILHADORA", 
    "DESGUARNECEDORA", "ESTABILIZADORA", "CAPINA QUÍMICA", "CAPINA QUIMICA"
]

def time_to_hours(t):
    """Converte datetime.time ou string 'HH:MM:SS' para float horas."""
    if pd.isna(t) or t == "":
        return 0.0
    
    if isinstance(t, time):
        return t.hour + t.minute / 60.0
    
    try:
        if isinstance(t, str):
            for fmt in ('%H:%M:%S', '%H:%M'):
                try:
                    dt = datetime.strptime(t, fmt)
                    return dt.hour + dt.minute / 60.0
                except ValueError:
                    continue
    except:
        pass
    
    return 0.0

def get_overview_data(view_mode='semana'):
    engine = get_db_engine()
    if not engine:
        return []

    today = datetime.now().date()
    
    if view_mode == 'mes':
        start_date = today.replace(day=1)
        next_month = (start_date.replace(day=28) + timedelta(days=4)).replace(day=1)
        end_date = next_month - timedelta(days=1)
    else: 
        idx = (today.weekday() + 1) % 7
        start_date = today - timedelta(days=idx)
        end_date = start_date + timedelta(days=6)

    str_start = start_date.strftime('%Y-%m-%d')
    str_end = end_date.strftime('%Y-%m-%d')

    query = text("""
        SELECT 
            gerencia_da_via, 
            atividade, 
            tipo, 
            data, 
            tempo_prog, 
            tempo_real, 
            status 
        FROM atividades 
        WHERE data >= :start AND data <= :end
    """)

    try:
        with engine.connect() as conn:
            df = pd.read_sql(query, conn, params={"start": str_start, "end": str_end})
        
        if df.empty:
            return []

        df['horas_prog'] = df['tempo_prog'].apply(time_to_hours)
        df['horas_real'] = df['tempo_real'].apply(time_to_hours)
        
        df['gerencia_norm'] = df['gerencia_da_via'].astype(str).str.upper()
        df['atividade_norm'] = df['atividade'].astype(str).str.upper()
        df['tipo_norm'] = df['tipo'].astype(str).str.upper()

        mask_mec = df['atividade_norm'].apply(lambda x: any(m in x for m in ATIVIDADES_MECANIZACAO))
        df_mec = df[mask_mec].copy()
        df_geral = df[~mask_mec].copy()

        def get_gerencia_id(g):
            if 'FERRONORTE' in g: return 'ferronorte'
            if 'SP NORTE' in g or 'SP_NORTE' in g: return 'sp_norte'
            if 'SP SUL' in g or 'SP_SUL' in g: return 'sp_sul'
            if 'CENTRAL' in g or 'MALHA CENTRAL' in g: return 'central'
            if 'MODERNIZA' in g: return 'modernizacao'
            return 'outros'

        df_geral['gid'] = df_geral['gerencia_norm'].apply(get_gerencia_id)
        
        output = []
        ids_order = ['ferronorte', 'sp_norte', 'sp_sul', 'central', 'modernizacao']

        for gid in ids_order:
            sub_df = df_geral[df_geral['gid'] == gid]
            output.append(_build_card_data(gid, sub_df, view_mode))

        if not df_mec.empty:
            mec_card = _build_card_data('mecanizacao', df_mec, view_mode)
            mec_card['title'] = "Mecanização"
            output.append(mec_card)
            
        return output

    except Exception as e:
        print(f"🔴 Erro no OverviewService: {e}")
        return []

def _build_card_data(gid, df, view_mode):
    titles = {
        'ferronorte': 'Ferronorte', 'sp_norte': 'SP Norte', 
        'sp_sul': 'SP Sul', 'central': 'Malha Central', 
        'modernizacao': 'Modernização', 'mecanizacao': 'Mecanização'
    }
    
    return {
        "id": gid,
        "title": titles.get(gid, gid.title()),
        "types": {
            "contrato": _agg_stats(df, "CONTRATO", view_mode),
            "oportunidade": _agg_stats(df, "OPORTUNIDADE", view_mode)
        }
    }

def _agg_stats(df, tipo_filtro, view_mode):
    if tipo_filtro == "CONTRATO":
        mask = df['tipo_norm'].str.contains("CONTRATO", na=False)
    else:
        mask = ~df['tipo_norm'].str.contains("CONTRATO", na=False)
    
    filtered = df[mask].copy()
    
    prog_h = filtered['horas_prog'].sum()
    real_h = filtered['horas_real'].sum()
    prog_int = len(filtered)
    real_int = filtered[
        (filtered['horas_real'] > 0) | 
        (filtered['status'].isin([1, 2, 3, 'CONCLUIDO', 'EM ANDAMENTO']))
    ].shape[0]

    percent = 0
    if prog_h > 0:
        percent = int((real_h / prog_h) * 100)
    
    chart_data = []
    
    if not filtered.empty:
        filtered['date_obj'] = pd.to_datetime(filtered['data'])
        
        if view_mode == 'semana':
            days_map = {0: 'Seg', 1: 'Ter', 2: 'Qua', 3: 'Qui', 4: 'Sex', 5: 'Sáb', 6: 'Dom'}
            filtered['dow'] = filtered['date_obj'].dt.dayofweek
            
            grouped = filtered.groupby('dow').agg({
                'horas_prog': 'sum', 
                'horas_real': 'sum'
            }).reindex(range(7), fill_value=0)
            
            for i in range(7):
                chart_data.append({
                    "name": days_map[i],
                    "prog": round(grouped.loc[i, 'horas_prog'], 1),
                    "real": round(grouped.loc[i, 'horas_real'], 1)
                })
        else:
            filtered['week'] = filtered['date_obj'].dt.isocalendar().week
            grouped = filtered.groupby('week').agg({
                'horas_prog': 'sum', 
                'horas_real': 'sum'
            }).sort_index()
            
            for w, row in grouped.iterrows():
                chart_data.append({
                    "name": f"Sem {w}",
                    "prog": round(row['horas_prog'], 1),
                    "real": round(row['horas_real'], 1)
                })
    else:
        if view_mode == 'semana':
            days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
            chart_data = [{"name": d, "prog": 0, "real": 0} for d in days]

    return {
        "kpis": {
            "prog_h": round(prog_h, 1),
            "real_h": round(real_h, 1),
            "prog_int": prog_int,
            "real_int": real_int
        },
        "percentual": percent,
        "meta": 85,
        "chartData": chart_data
    }