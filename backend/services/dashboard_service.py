import pandas as pd
from sqlalchemy import text
from backend.db.connection import get_db_engine
from datetime import datetime

def get_dashboard_data(filters=None):
    engine = get_db_engine()
    if not engine:
        return []

    target_date = None
    if filters and filters.get('data'):
        target_date = filters.get('data')
    else:
        with engine.connect() as conn:
            target_date = conn.execute(text("SELECT MAX(data) FROM atividades")).scalar()
    
    if not target_date:
        target_date = datetime.now().strftime('%Y-%m-%d')

    query = text("""
        SELECT 
            id, row_hash, status, gerencia_da_via, trecho_da_via, sub_trecho,
            ativo, atividade, tipo, data,
            inicio_prog, inicio_real, fim_prog, fim_real,
            tempo_prog, tempo_real,
            local_prog, local_real, producao_prog, producao_real,
            detalhe_local
        FROM atividades
        WHERE data = :data_ref
        ORDER BY data DESC, status ASC, inicio_prog ASC
    """)

    try:
        with engine.connect() as conn:
            df = pd.read_sql(query, conn, params={"data_ref": target_date})
        
        if df.empty:
            return []

        dashboard_data = []
        
        for _, row in df.iterrows():
            def fmt_time(t):
                if pd.isna(t) or t == "" or t is None: return "--:--"
                try:
                    if hasattr(t, 'strftime'): return t.strftime('%H:%M')
                    return str(t)[:5]
                except:
                    return "--:--"

            # --- CORREÇÃO AQUI ---
            # Converte float (2.0), int (2) ou string ("2") para inteiro
            status_val = None
            if pd.notna(row['status']):
                try:
                    status_val = int(float(row['status']))
                except:
                    status_val = None
            # ---------------------

            data_fmt = "--/--"
            if pd.notna(row['data']):
                try:
                    data_fmt = row['data'].strftime('%d/%m')
                except:
                    data_fmt = str(row['data'])

            item = {
                "id": row['id'] or row['row_hash'],
                "row_hash": row['row_hash'],
                "status": status_val,
                "data": data_fmt,
                
                "gerencia": row['gerencia_da_via'] or "",
                "trecho": row['trecho_da_via'] or "",
                "sub": row['sub_trecho'] or "",
                "tipo": row['tipo'] or "",
                
                "ativo": row['ativo'] or "N/A",
                "atividade": row['atividade'] or "",
                "detalhe": row['detalhe_local'] or "",
                
                "inicio": {
                    "prog": fmt_time(row['inicio_prog']),
                    "real": fmt_time(row['inicio_real'])
                },
                "tempo": {
                    "prog": fmt_time(row['tempo_prog']),
                    "real": fmt_time(row['tempo_real']),
                    "isTimer": status_val == 1
                },
                "local": {
                    "prog": row['local_prog'] or "-",
                    "real": row['local_real'] or "-"
                },
                "quant": {
                    "prog": str(row['producao_prog'] or 0),
                    "real": str(row['producao_real'] or 0)
                }
            }
            dashboard_data.append(item)

        return dashboard_data

    except Exception as e:
        print(f"Erro no DashboardService (get_dashboard_data): {e}")
        return []

def get_last_migration_time():
    engine = get_db_engine()
    if not engine:
        return {"last_updated_at": None}

    query = text("SELECT last_updated_at FROM migration_log ORDER BY last_updated_at DESC LIMIT 1")
    
    try:
        with engine.connect() as conn:
            result = conn.execute(query).scalar()
            
            if result:
                iso_time = result.isoformat()
                if not iso_time.endswith('Z') and '+' not in iso_time:
                    iso_time += 'Z'
                return {"last_updated_at": iso_time}
            else:
                return {"last_updated_at": None}

    except Exception as e:
        print(f"Erro no DashboardService (get_last_migration_time): {e}")
        return {"last_updated_at": None}