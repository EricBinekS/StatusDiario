import pandas as pd
from sqlalchemy import text
from db.database import get_db_engine

# --- CONSTANTES DE REGRAS DE NEGÓCIO ---

# Modernização removida daqui pois agora está no data_processor.py

ATIVIDADES_MECANIZACAO = [
    "MECANIZAÇÃO - CAPINA QUÍMICA",
    "MECANIZAÇÃO - DOL", 
    "MECANIZAÇÃO - ESMERILHADORA", 
    "MECANIZAÇÃO - MANUTENÇÃO", 
    "MECANIZAÇÃO - SOCADORA"
]

# Normaliza para comparação
ATIVIDADES_MECANIZACAO = [x.strip().upper() for x in ATIVIDADES_MECANIZACAO]


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

def _get_chart_data(df, view_mode):
    """Gera os dados do gráfico agrupados por dia ou semana."""
    chart_data = []
    
    if df.empty:
        return chart_data

    # Garante que é datetime
    df['data_dt'] = pd.to_datetime(df['data'])

    if view_mode == 'semana':
        # Agrupamento por Dia da Semana (0=Seg, 6=Dom)
        days_map = {0: 'Seg', 1: 'Ter', 2: 'Qua', 3: 'Qui', 4: 'Sex', 5: 'Sáb', 6: 'Dom'}
        df['day_of_week'] = df['data_dt'].dt.dayofweek
        
        grouped = df.groupby('day_of_week')
        
        for i in range(7):
            if i in grouped.groups:
                grp = grouped.get_group(i)
                prog = len(grp)
                real = grp['foi_realizado'].sum()
            else:
                prog = 0
                real = 0
            
            chart_data.append({
                "name": days_map[i],
                "prog": int(prog),
                "real": int(real)
            })

    elif view_mode == 'mes':
        # Agrupamento por Semana do Ano
        df['week_num'] = df['data_dt'].dt.isocalendar().week
        
        grouped = df.groupby('week_num')
        sorted_weeks = sorted(list(grouped.groups.keys()))
        
        for i, w_num in enumerate(sorted_weeks):
            grp = grouped.get_group(w_num)
            prog = len(grp)
            real = grp['foi_realizado'].sum()
            
            chart_data.append({
                "name": f"Sem {w_num}",
                "prog": int(prog),
                "real": int(real)
            })

    return chart_data

def get_overview_data(start_date=None, end_date=None, view_mode='semana'):
    engine = get_db_engine()
    if not engine:
        return []

    # Query na tabela
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

    # 2. Definir se foi realizado
    df['foi_realizado'] = df['inicio_real'].notna() & (df['inicio_real'] != '') & (df['inicio_real'] != '00:00')

    # A REGRA DE MODERNIZAÇÃO FOI REMOVIDA DAQUI POIS O DATA_PROCESSOR JÁ TRATOU

    # 4. Normalizar Gerencia (IDs e Labels)
    coluna_gerencia = 'gerência_da_via' if 'gerência_da_via' in df.columns else 'gerencia_da_via'

    def normalizar_gerencia(g):
        g = str(g).upper()
        if 'FERRONORTE' in g: return 'ferronorte', 'Ferronorte'
        if 'SP NORTE' in g or 'MALHA PAULISTA' in g: return 'sp_norte', 'SP Norte'
        if 'SP SUL' in g or 'MALHA SUL' in g: return 'sp_sul', 'SP Sul'
        if 'CENTRAL' in g: return 'central', 'Malha Central'
        # O data_processor já setou 'MODERNIZAÇÃO', então esta linha vai capturar corretamente:
        if 'MODERNIZA' in g: return 'modernizacao', 'Modernização'
        
        return 'outros', g.title() if g != 'NAN' else 'Outros'

    df[['gerencia_id', 'gerencia_label']] = df[coluna_gerencia].apply(
        lambda x: pd.Series(normalizar_gerencia(x))
    )

    # 5. Normalizar Tipo
    df['tipo_norm'] = df['tipo'].apply(
        lambda x: 'contrato' if x and 'CONTRATO' in str(x).upper() else 'oportunidade'
    )

    # 6. Agrupar KPIs Gerais
    grouped = df.groupby(['gerencia_id', 'gerencia_label', 'tipo_norm']).agg(
        total_int_prog=('row_hash', 'count'),
        total_int_real=('foi_realizado', 'sum'),
        total_min_prog=('minutos_prog', 'sum'),
        total_min_real=('minutos_real', 'sum')
    ).reset_index()

    # 7. REGRA DE NEGÓCIO: MECANIZAÇÃO (Mantida aqui pois é apenas visualização/filtro)
    df_mecanizacao = pd.DataFrame()
    if 'atividade' in df.columns:
        mask_mec = df['atividade'].astype(str).str.strip().str.upper().isin(ATIVIDADES_MECANIZACAO)
        df_mecanizacao = df[mask_mec].copy()

    # 8. Montar JSON
    output_data = {}
    
    ids_esperados = ['ferronorte', 'sp_norte', 'sp_sul', 'central', 'modernizacao', 'mecanizacao']
    labels_esperados = ['Ferronorte', 'SP Norte', 'SP Sul', 'Malha Central', 'Modernização', 'Mecanização']
    
    for gid, glabel in zip(ids_esperados, labels_esperados):
        output_data[gid] = {
            "id": gid, "title": glabel,
            "types": { "contrato": _empty_stats(), "oportunidade": _empty_stats() }
        }

    # Preencher KPIs (Cards Normais e Modernização)
    for _, row in grouped.iterrows():
        g_id = row['gerencia_id']
        if g_id not in output_data: continue
        # Mecanização é tratada separadamente
        if g_id == 'mecanizacao': continue 

        tipo = row['tipo_norm']
        stats = output_data[g_id]["types"][tipo]

        stats["kpis"]["prog_int"] = int(row['total_int_prog'])
        stats["kpis"]["real_int"] = int(row['total_int_real'])
        stats["kpis"]["prog_h"] = round(row['total_min_prog'] / 60, 1)
        stats["kpis"]["real_h"] = round(row['total_min_real'] / 60, 1)

        if stats["kpis"]["prog_int"] > 0:
            stats["percentual"] = int((stats["kpis"]["real_int"] / stats["kpis"]["prog_int"]) * 100)

        # Gráficos
        mask = (df['gerencia_id'] == g_id) & (df['tipo_norm'] == tipo)
        output_data[g_id]["types"][tipo]["chartData"] = _get_chart_data(df[mask].copy(), view_mode)

    # 9. Preencher KPIs e Gráficos da MECANIZAÇÃO
    if not df_mecanizacao.empty:
        mec_grouped = df_mecanizacao.groupby('tipo_norm').agg(
            total_int_prog=('row_hash', 'count'),
            total_int_real=('foi_realizado', 'sum'),
            total_min_prog=('minutos_prog', 'sum'),
            total_min_real=('minutos_real', 'sum')
        ).reset_index()

        for _, row in mec_grouped.iterrows():
            tipo = row['tipo_norm']
            stats = output_data['mecanizacao']["types"][tipo]

            stats["kpis"]["prog_int"] = int(row['total_int_prog'])
            stats["kpis"]["real_int"] = int(row['total_int_real'])
            stats["kpis"]["prog_h"] = round(row['total_min_prog'] / 60, 1)
            stats["kpis"]["real_h"] = round(row['total_min_real'] / 60, 1)

            if stats["kpis"]["prog_int"] > 0:
                stats["percentual"] = int((stats["kpis"]["real_int"] / stats["kpis"]["prog_int"]) * 100)
            
            mask_mec_tipo = df_mecanizacao['tipo_norm'] == tipo
            output_data['mecanizacao']["types"][tipo]["chartData"] = _get_chart_data(df_mecanizacao[mask_mec_tipo].copy(), view_mode)
    
    return list(output_data.values())

def _empty_stats():
    return {
        "percentual": 0, "meta": 85,
        "kpis": {"prog_int": 0, "real_int": 0, "prog_h": 0, "real_h": 0},
        "chartData": []
    }