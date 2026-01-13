from sqlalchemy import text
from backend.db.connection import get_db_engine
from datetime import datetime
import re

def get_last_migration_time():
    engine = get_db_engine()
    if not engine: return None
    try:
        with engine.connect() as conn:
            return conn.execute(text("SELECT last_updated_at FROM migration_log WHERE id = 1")).scalar()
    except:
        return None

def is_valid_entry(value):
    """ Validação de Dados (ETL Check) """
    if value is None: return False
    s = str(value).strip()
    if not s: return False
    if s in ['-', '--', '.', '?', 'N/A', 'NULL', '0']: return False
    if re.match(r'^[\W_]+$', s): return False
    return True

def get_dashboard_data(filters=None):
    engine = get_db_engine()
    if not engine: return []

    filters = filters or {}
    
    # REMOVIDO 'trecho' DA QUERY
    sql = """
        SELECT 
            id, gerencia_da_via, atividade, tipo, data, status,
            inicio_prog, inicio_real, fim_prog, fim_real,
            tempo_prog, tempo_real,
            local_prog, local_real,
            producao_prog, producao_real,
            status_1 as detalhamento,
            ativo
        FROM atividades
        WHERE 1=1
    """
    
    params = {}

    if filters.get('dateRange'):
        start = filters['dateRange'].get('start')
        end = filters['dateRange'].get('end')
        if start and end:
            sql += " AND data >= :start_date AND data <= :end_date"
            params['start_date'] = start
            params['end_date'] = end

    if filters.get('gerencia'):
        gerencias = [g.upper() for g in filters['gerencia']]
        if gerencias:
            sql += " AND gerencia_da_via IN :gerencias"
            params['gerencias'] = tuple(gerencias)

    if filters.get('status'):
        status_list = [s.upper() for s in filters['status']]
        if status_list:
            sql += " AND status IN :status_list"
            params['status_list'] = tuple(status_list)

    if filters.get('tipo'):
        tipo_term = filters['tipo'].upper()
        if tipo_term == 'CONTRATO': sql += " AND tipo LIKE '%CONTRATO%'"
        elif tipo_term == 'OPORTUNIDADE': sql += " AND tipo NOT LIKE '%CONTRATO%'"

    sql += " ORDER BY data DESC, inicio_prog ASC LIMIT 2000"

    try:
        with engine.connect() as conn:
            conn.execute(text("SET statement_timeout = 60000;"))
            result = conn.execute(text(sql), params)
            rows = result.mappings().all()
            
            data = []
            for row in rows:
                item = dict(row)

                # --- ETAPA DE ETL / LIMPEZA ---
                # Validando apenas Gerência (Trecho removido)
                if not is_valid_entry(item.get('gerencia_da_via')):
                    continue
                # ------------------------------
                
                if isinstance(item.get('data'), (datetime,)):
                    item['data'] = item['data'].strftime('%Y-%m-%d')
                else:
                    item['data'] = str(item['data'])
                
                time_cols = [
                    'inicio_prog', 'inicio_real', 
                    'fim_prog', 'fim_real', 
                    'tempo_prog', 'tempo_real'
                ]
                
                for col in time_cols:
                    val = item.get(col)
                    if val is None:
                        item[col] = None 
                    else:
                        item[col] = str(val)[:5]
                
                data.append(item)
                
            return data

    except Exception as e:
        print(f"🔴 Erro no DashboardService: {e}")
        return []