from sqlalchemy import text
from backend.db.connection import get_db_engine
from datetime import datetime, date
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
    if value is None: return False
    s = str(value).strip()
    if not s: return False
    if s in ['-', '--', '.', '?', 'N/A', 'NULL', '0']: return False
    if re.match(r'^[\W_]+$', s): return False
    return True

def determine_detalhamento(row):
    """
    Define qual status mostrar (1 ou 2) com base na data e hora atual.
    """
    s1 = row.get('status_1') or ''
    s2 = row.get('status_2') or ''
    
    row_date = row.get('data')
    
    # --- CORREÇÃO DO ERRO ---
    # Se for datetime, pega só a data (.date())
    if isinstance(row_date, datetime):
        row_date = row_date.date()
    # Se for string, tenta converter
    elif isinstance(row_date, str):
        try:
            row_date = datetime.strptime(row_date, '%Y-%m-%d').date()
        except:
            pass # Se falhar, vai cair no fallback abaixo
            
    today = datetime.now().date()
    current_hour = datetime.now().hour
    
    # Fallback de segurança: se ainda não for date, assume hoje
    if not isinstance(row_date, date):
        row_date = today

    # Lógica de Seleção
    if row_date < today:
        # Passado: Prioriza o fechamento (2)
        return s2 if s2 else s1
        
    elif row_date > today:
        # Futuro: Planejamento (1)
        return s1
        
    else:
        # Hoje: Corte às 13h
        if current_hour >= 13:
            return s2 if s2 else s1
        else:
            return s1

def get_dashboard_data(filters=None):
    engine = get_db_engine()
    if not engine: return []

    filters = filters or {}
    
    # Query buscando status_1 e status_2 explicitamente
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

                if not is_valid_entry(item.get('gerencia_da_via')):
                    continue
                
                # Campos auxiliares para filtros do frontend
                item['trecho'] = item.get('trecho_da_via')
                item['sub'] = item.get('sub_trecho')
                
                # --- APLICA A REGRA DE DETALHAMENTO COM A CORREÇÃO ---
                item['detalhamento'] = determine_detalhamento(item)
                # -----------------------------------------------------

                # Formata Data para string antes de enviar pro JSON
                if isinstance(item.get('data'), (datetime, date)):
                    item['data'] = item['data'].strftime('%Y-%m-%d')
                else:
                    item['data'] = str(item['data'])
                
                # Formata Horas
                time_cols = ['inicio_prog', 'inicio_real', 'fim_prog', 'fim_real', 'tempo_prog', 'tempo_real']
                for col in time_cols:
                    val = item.get(col)
                    item[col] = str(val)[:5] if val is not None else None
                
                data.append(item)
                
            return data

    except Exception as e:
        print(f"🔴 Erro no DashboardService: {e}")
        return []