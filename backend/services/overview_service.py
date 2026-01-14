from sqlalchemy import text
from backend.db.connection import get_db_engine
from backend.business_rules import SQL_CONSTANTS, is_valid_entry

def get_overview_kpis(filters=None):
    engine = get_db_engine()
    if not engine: return {}

    filters = filters or {}
    params = {}
    
    sql_base = " FROM atividades WHERE 1=1 "

    if filters.get('dateRange'):
        start = filters['dateRange'].get('start')
        end = filters['dateRange'].get('end')
        if start and end:
            sql_base += " AND data >= :start_date AND data <= :end_date"
            params['start_date'] = start
            params['end_date'] = end

    if filters.get('gerencia'):
        gerencias = [g.upper() for g in filters['gerencia']]
        if gerencias:
            sql_base += " AND gerencia_da_via IN :gerencias"
            params['gerencias'] = tuple(gerencias)

    if filters.get('tipo'):
        tipo_term = filters['tipo'].upper()
        if tipo_term == 'CONTRATO': 
            sql_base += f" AND tipo LIKE '{SQL_CONSTANTS['contract_pattern']}'"
        elif tipo_term == 'OPORTUNIDADE': 
            sql_base += f" AND tipo NOT LIKE '{SQL_CONSTANTS['contract_pattern']}'"

    try:
        with engine.connect() as conn:
            
            sql_total = f"SELECT COUNT(*) {sql_base}"
            total = conn.execute(text(sql_total), params).scalar() or 0

            sql_status = f"""
                SELECT status, COUNT(*) as count 
                {sql_base} 
                GROUP BY status
            """
            result_status = conn.execute(text(sql_status), params).fetchall()
            
            status_dist = {row.status: row.count for row in result_status if is_valid_entry(row.status)}

            sql_aderencia = f"""
                SELECT 
                    SUM(CAST(producao_real AS FLOAT)) as total_real,
                    SUM(CAST(producao_prog AS FLOAT)) as total_prog
                {sql_base} 
                AND status IN ('CONCLUIDO', 'PARCIAL')
            """
            row_prod = conn.execute(text(sql_aderencia), params).mappings().one_or_none()
            
            aderencia_media = 0.0
            if row_prod and row_prod['total_prog'] and row_prod['total_prog'] > 0:
                aderencia_media = (row_prod['total_real'] / row_prod['total_prog']) * 100

            return {
                "total_atividades": total,
                "distribuicao_status": status_dist,
                "aderencia_global": round(aderencia_media, 2)
            }

    except Exception as e:
        print(f"🔴 Erro no OverviewService: {e}")
        return {}