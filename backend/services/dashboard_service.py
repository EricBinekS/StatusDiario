from sqlalchemy import text
from backend.db.connection import get_db_engine
from datetime import datetime, date
import re
from backend.business_rules import select_display_message, is_valid_entry, SQL_CONSTANTS

def get_last_migration_time():
    engine = get_db_engine()
    if not engine: return None
    try:
        with engine.connect() as conn:
            return conn.execute(text("SELECT last_updated_at FROM migration_log WHERE id = 1")).scalar()
    except:
        return None

def get_dashboard_data(filters=None):
    engine = get_db_engine()
    if not engine: return []

    filters = filters or {}
    
    sql = """
        SELECT 
            id, gerencia_da_via, trecho_da_via, sub_trecho, atividade, tipo, data, status,
            inicio_prog, inicio_real, fim_prog, fim_real,
            tempo_prog, tempo_real,
            local_prog, local_real,
            producao_prog, producao_real,
            status_1, status_2,
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
        if tipo_term == 'CONTRATO': 
            sql += f" AND tipo LIKE '{SQL_CONSTANTS['contract_pattern']}'"
        elif tipo_term == 'OPORTUNIDADE': 
            sql += f" AND tipo NOT LIKE '{SQL_CONSTANTS['contract_pattern']}'"

    sql += " ORDER BY data DESC, inicio_prog ASC LIMIT 2000"

    try:
        with engine.connect() as conn:
            conn.execute(text("SET statement_timeout = 60000;"))
            result = conn.execute(text(sql), params)
            rows = result.mappings().all()
            
            data = []
            for row in rows:
                item = dict(row)

                if not is_valid_entry(item.get('gerencia_da_via')):
                    continue
                
                item['trecho'] = item.get('trecho_da_via')
                item['sub'] = item.get('sub_trecho')
                
                item['detalhamento'] = select_display_message(
                    item.get('data'), 
                    item.get('status_1'), 
                    item.get('status_2')
                )
                
                if isinstance(item.get('data'), (datetime, date)):
                    item['data'] = item['data'].strftime('%Y-%m-%d')
                else:
                    item['data'] = str(item['data'])
                
                time_cols = ['inicio_prog', 'inicio_real', 'fim_prog', 'fim_real', 'tempo_prog', 'tempo_real']
                for col in time_cols:
                    val = item.get(col)
                    item[col] = str(val)[:5] if val is not None else None
                
                data.append(item)
                
            return data

    except Exception as e:
        print(f"🔴 Erro no DashboardService: {e}")
        return []