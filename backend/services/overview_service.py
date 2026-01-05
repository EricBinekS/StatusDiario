from sqlalchemy import text
from backend.db.connection import get_db_engine
from datetime import datetime, timedelta, time

# --- CONFIGURAÇÃO ---
ATIVIDADES_MECANIZACAO = {
    "MECANIZACAO", "MECANIZAÇÃO", "SOCADORA", "REGULADORA", "ESMERILHADORA", 
    "DESGUARNECEDORA", "ESTABILIZADORA", "CAPINA QUÍMICA", "CAPINA QUIMICA"
}

def time_to_hours(t):
    """Converte datetime.time, timedelta ou string para float horas."""
    if t is None or t == "":
        return 0.0
    try:
        if isinstance(t, time):
            return t.hour + t.minute / 60.0
        if isinstance(t, timedelta):
            return t.total_seconds() / 3600.0
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
    
    # 1. Definição do Período
    if view_mode == 'mes':
        start_date = today.replace(day=1)
        next_month = (start_date.replace(day=28) + timedelta(days=4)).replace(day=1)
        end_date = next_month - timedelta(days=1)
    else: 
        idx = today.weekday() # 0=Seg, 6=Dom
        start_date = today - timedelta(days=idx)
        end_date = start_date + timedelta(days=6)

    # 2. Query Otimizada
    query = text("""
        SELECT 
            gerencia_da_via, atividade, tipo, data, 
            tempo_prog, tempo_real, status 
        FROM atividades 
        WHERE data >= :start AND data <= :end
    """)

    try:
        with engine.connect() as conn:
            # --- CORREÇÃO DO TIMEOUT ---
            conn.execute(text("SET statement_timeout = 60000;"))
            result = conn.execute(query, {"start": start_date, "end": end_date})
            rows = result.mappings().all()
        
        if not rows:
            return []

        # 3. Inicializa Estruturas de Agregação
        ids_order = ['ferronorte', 'sp_norte', 'sp_sul', 'central', 'modernizacao', 'mecanizacao']
        stats = {gid: {'contrato': _init_stats(), 'oportunidade': _init_stats()} for gid in ids_order}

        # 4. Processamento Python Puro (Leve)
        for row in rows:
            g_raw = str(row['gerencia_da_via'] or "").upper()
            ativ_raw = str(row['atividade'] or "").upper()
            tipo_raw = str(row['tipo'] or "").upper()
            status_raw = str(row['status'] or "").upper()
            
            h_prog = time_to_hours(row['tempo_prog'])
            h_real = time_to_hours(row['tempo_real'])
            
            # Identifica Grupo
            gid = 'outros'
            is_mec = any(m in ativ_raw for m in ATIVIDADES_MECANIZACAO)
            
            if is_mec: gid = 'mecanizacao'
            elif 'FERRONORTE' in g_raw: gid = 'ferronorte'
            elif 'SP NORTE' in g_raw or 'SP_NORTE' in g_raw: gid = 'sp_norte'
            elif 'SP SUL' in g_raw or 'SP_SUL' in g_raw: gid = 'sp_sul'
            elif 'CENTRAL' in g_raw or 'MALHA CENTRAL' in g_raw: gid = 'central'
            elif 'MODERNIZA' in g_raw: gid = 'modernizacao'
            
            if gid not in stats: continue
            
            cat_key = 'contrato' if 'CONTRATO' in tipo_raw else 'oportunidade'
            
            # Soma totais
            s = stats[gid][cat_key]
            s['prog_h'] += h_prog
            s['real_h'] += h_real
            s['prog_int'] += 1 # Conta linhas (ocorrências)
            
            # Lógica de Realizado
            is_realized = (h_real > 0)
            if not is_realized and status_raw in ['1', '2', '3', 'CONCLUIDO', 'EM ANDAMENTO', '1.0', '2.0', '3.0']:
                is_realized = True
            
            if is_realized: s['real_int'] += 1

            # Agregação para Gráficos
            dt = row['data']
            if dt:
                key = dt.weekday() if view_mode == 'semana' else dt.isocalendar()[1]
                if key not in s['chart_agg']: s['chart_agg'][key] = {'p': 0.0, 'r': 0.0}
                s['chart_agg'][key]['p'] += h_prog
                s['chart_agg'][key]['r'] += h_real

        # 5. Monta Resposta
        output = []
        titles = {
            'ferronorte': 'Ferronorte', 'sp_norte': 'SP Norte', 
            'sp_sul': 'SP Sul', 'central': 'Malha Central', 
            'modernizacao': 'Modernização', 'mecanizacao': 'Mecanização'
        }

        # Blocos Principais (Corrigido para não mostrar cards vazios)
        for gid in [i for i in ids_order if i != 'mecanizacao']:
            g_stats = stats[gid]
            # Verifica se tem algum dado (programado ou realizado)
            has_data = (g_stats['contrato']['prog_int'] > 0 or g_stats['oportunidade']['prog_int'] > 0)
            
            if has_data:
                output.append(_build_final_object(gid, titles.get(gid, gid.title()), g_stats, view_mode))

        # Bloco Mecanização
        mec_stats = stats['mecanizacao']
        if (mec_stats['contrato']['prog_int'] > 0 or mec_stats['oportunidade']['prog_int'] > 0):
             output.append(_build_final_object('mecanizacao', 'Mecanização', mec_stats, view_mode))

        return output

    except Exception as e:
        print(f"🔴 Erro no OverviewService: {e}")
        return []

def _init_stats():
    return {'prog_h': 0.0, 'real_h': 0.0, 'prog_int': 0, 'real_int': 0, 'chart_agg': {}}

def _build_final_object(gid, title, group_stats, view_mode):
    return {
        "id": gid,
        "title": title,
        "types": {
            "contrato": _finalize_stats(group_stats['contrato'], view_mode),
            "oportunidade": _finalize_stats(group_stats['oportunidade'], view_mode)
        }
    }

def _finalize_stats(s, view_mode):
    percent = 0
    if s['prog_h'] > 0:
        percent = int((s['real_h'] / s['prog_h']) * 100)
    
    chart_data = []
    if view_mode == 'semana':
        days_map = {0: 'Seg', 1: 'Ter', 2: 'Qua', 3: 'Qui', 4: 'Sex', 5: 'Sáb', 6: 'Dom'}
        for i in range(7):
            val = s['chart_agg'].get(i, {'p': 0, 'r': 0})
            chart_data.append({"name": days_map[i], "prog": round(val['p'], 1), "real": round(val['r'], 1)})
    else:
        for w in sorted(s['chart_agg'].keys()):
            val = s['chart_agg'][w]
            chart_data.append({"name": f"Sem {w}", "prog": round(val['p'], 1), "real": round(val['r'], 1)})

    return {
        "kpis": {
            "prog_h": round(s['prog_h'], 1), "real_h": round(s['real_h'], 1),
            "prog_int": s['prog_int'], "real_int": s['real_int']
        },
        "percentual": percent,
        "meta": 85,
        "chartData": chart_data
    }