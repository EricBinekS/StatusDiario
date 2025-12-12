import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy import text
from db.connection import get_db_engine

# --- CONFIGURAÇÃO ---
ATIVIDADES_MECANIZACAO = [
    "MECANIZAÇÃO", "SOCADORA", "REGULADORA", "ESMERILHADORA", 
    "DESGUARNECEDORA", "ESTABILIZADORA", "CAPINA QUÍMICA"
]

def _calculate_hours(row, start_col, end_col):
    """Calcula diferença em horas entre duas colunas de tempo."""
    try:
        if pd.isna(row[start_col]) or pd.isna(row[end_col]):
            return 0.0
        
        # Converte strings de tempo para timedelta se já não forem
        # Assumindo que o banco retorna objetos datetime.time ou strings 'HH:MM:SS'
        # Aqui simplificamos: O Pandas read_sql geralmente traz como datetime ou object
        
        # Se for datetime no dataframe:
        delta = row[end_col] - row[start_col]
        return delta.total_seconds() / 3600.0
    except:
        return 0.0

def get_overview_data(view_mode='semana'):
    """
    Gera indicadores gerenciais.
    view_mode: 'semana' (Dom-Sáb) ou 'mes' (1-30).
    """
    engine = get_db_engine()
    if not engine:
        return []

    # 1. Definição de Período (Regra de Negócio: Datas Fixas)
    today = datetime.now().date()
    
    if view_mode == 'mes':
        start_date = today.replace(day=1)
        # Gambiarra segura para achar ultimo dia do mês
        next_month = start_date.replace(day=28) + timedelta(days=4)
        end_date = next_month - timedelta(days=next_month.day)
    else: # Semana (Domingo a Sábado)
        # weekday: Seg=0, Dom=6.
        # Se hoje é Qua(2). Domingo passado foi Hoje - (2+1) = -3 dias.
        idx = (today.weekday() + 1) % 7
        start_date = today - timedelta(days=idx)
        end_date = start_date + timedelta(days=6)

    str_start = start_date.strftime('%Y-%m-%d')
    str_end = end_date.strftime('%Y-%m-%d')

    # 2. Query Filtrada
    query = text("""
        SELECT * FROM atividades 
        WHERE data >= :start AND data <= :end
    """)

    try:
        with engine.connect() as conn:
            df = pd.read_sql(query, conn, params={"start": str_start, "end": str_end})
        
        if df.empty:
            return []

        # 3. Pré-processamento e Cálculos
        df['inicio_prog'] = pd.to_datetime(df['inicio_prog'].astype(str), format='%H:%M:%S', errors='coerce')
        df['fim_prog'] = pd.to_datetime(df['fim_prog'].astype(str), format='%H:%M:%S', errors='coerce')
        df['inicio_real'] = pd.to_datetime(df['inicio_real'].astype(str), format='%H:%M:%S', errors='coerce')
        df['fim_real'] = pd.to_datetime(df['fim_real'].astype(str), format='%H:%M:%S', errors='coerce')

        # Cálculo de Horas (Regra: Fim - Inicio)
        # Precisamos lidar com virada de dia? Por enquanto assumimos mesmo dia.
        df['horas_prog'] = (df['fim_prog'] - df['inicio_prog']).dt.total_seconds() / 3600
        df['horas_real'] = (df['fim_real'] - df['inicio_real']).dt.total_seconds() / 3600
        
        # Limpeza de negativos ou nulos
        df['horas_prog'] = df['horas_prog'].fillna(0).clip(lower=0)
        df['horas_real'] = df['horas_real'].fillna(0).clip(lower=0)

        # 4. Separação Mecanização (Regra Visual)
        # Normaliza string para busca
        df['atividade_norm'] = df['atividade'].astype(str).str.upper()
        mask_mec = df['atividade_norm'].apply(lambda x: any(m in x for m in ATIVIDADES_MECANIZACAO))
        
        df_mec = df[mask_mec].copy()
        df_geral = df[~mask_mec].copy()

        # 5. Estruturação do JSON de Resposta
        # IDs das gerências esperadas
        ids = ['ferronorte', 'sp_norte', 'sp_sul', 'central', 'modernizacao', 'mecanizacao', 'outros']
        
        # Helper para normalizar nome da gerencia
        def get_gerencia_id(g):
            g = str(g).upper()
            if 'FERRONORTE' in g: return 'ferronorte'
            if 'SP NORTE' in g: return 'sp_norte'
            if 'SP SUL' in g: return 'sp_sul'
            if 'CENTRAL' in g: return 'central'
            if 'MODERNIZA' in g: return 'modernizacao'
            return 'outros'

        df_geral['gid'] = df_geral['gerencia_da_via'].apply(get_gerencia_id)
        
        # Objeto final
        output = []

        # Processa Gerências Normais
        for gid in ['ferronorte', 'sp_norte', 'sp_sul', 'central', 'modernizacao', 'outros']:
            sub_df = df_geral[df_geral['gid'] == gid]
            if sub_df.empty and gid == 'outros': continue # Pula 'outros' se vazio
            
            output.append(_build_card_data(gid, sub_df, view_mode))

        # Processa Mecanização (Card Separado)
        if not df_mec.empty:
            mec_card = _build_card_data('mecanizacao', df_mec, view_mode)
            mec_card['title'] = "Mecanização" # Título bonito
            output.append(mec_card)
            
        return output

    except Exception as e:
        print(f"🔴 Erro no OverviewService: {e}")
        return []

def _build_card_data(gid, df, view_mode):
    """Monta a estrutura do card (Contrato vs Oportunidade)."""
    
    # Estrutura base
    titles = {
        'ferronorte': 'Ferronorte', 'sp_norte': 'SP Norte', 
        'sp_sul': 'SP Sul', 'central': 'Malha Central', 
        'modernizacao': 'Modernização', 'mecanizacao': 'Mecanização', 'outros': 'Outros'
    }
    
    card = {
        "id": gid,
        "title": titles.get(gid, gid.title()),
        "types": {
            "contrato": _agg_stats(df, "CONTRATO", view_mode),
            "oportunidade": _agg_stats(df, "OPORTUNIDADE", view_mode) # Tudo que não é contrato cai aqui? Ou filtramos explícito?
        }
    }
    return card

def _agg_stats(df, tipo_filtro, view_mode):
    """Agrega estatísticas para um tipo específico."""
    # Filtra por tipo (Contrato ou não)
    if tipo_filtro == "CONTRATO":
        mask = df['tipo'].astype(str).str.upper().str.contains("CONTRATO")
    else:
        mask = ~df['tipo'].astype(str).str.upper().str.contains("CONTRATO")
    
    filtered = df[mask]
    
    # KPIs
    prog_h = filtered['horas_prog'].sum()
    real_h = filtered['horas_real'].sum()
    prog_int = len(filtered)
    real_int = filtered[filtered['horas_real'] > 0].shape[0] # Considera realizado se teve horas

    percent = 0
    if prog_h > 0:
        percent = int((real_h / prog_h) * 100)
    
    # Gráfico (Agrupamento Temporal)
    chart_data = []
    if not filtered.empty:
        filtered = filtered.copy() # Evita warning
        filtered['date_obj'] = pd.to_datetime(filtered['data'])
        
        if view_mode == 'semana':
            # Agrupa por Dia da Semana (0-6)
            days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
            filtered['dow'] = filtered['date_obj'].dt.dayofweek
            grouped = filtered.groupby('dow').agg({'horas_prog': 'sum', 'horas_real': 'sum'}).reindex(range(7), fill_value=0)
            
            for i in range(7):
                chart_data.append({
                    "name": days[i],
                    "prog": round(grouped.loc[i, 'horas_prog'], 1),
                    "real": round(grouped.loc[i, 'horas_real'], 1)
                })
        else:
            # Agrupa por Semana do Ano
            filtered['week'] = filtered['date_obj'].dt.isocalendar().week
            grouped = filtered.groupby('week').agg({'horas_prog': 'sum', 'horas_real': 'sum'}).sort_index()
            
            for w, row in grouped.iterrows():
                chart_data.append({
                    "name": f"Sem {w}",
                    "prog": round(row['horas_prog'], 1),
                    "real": round(row['horas_real'], 1)
                })

    return {
        "kpis": {
            "prog_h": round(prog_h, 1),
            "real_h": round(real_h, 1),
            "prog_int": prog_int,
            "real_int": real_int
        },
        "percentual": percent,
        "meta": 85, # Meta Hardcoded
        "chartData": chart_data
    }