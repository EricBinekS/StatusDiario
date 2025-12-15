from backend.db.connection import get_db_engine
from sqlalchemy import text
from datetime import datetime

class DashboardService:
    @staticmethod
    def get_dashboard_data(data_ref=None):
        engine = get_db_engine()
        
        if not data_ref:
            with engine.connect() as conn:
                last = conn.execute(text("SELECT MAX(data) FROM atividades")).scalar()
                data_ref = last if last else datetime.now().strftime('%Y-%m-%d')

        query = text("""
            SELECT 
                id, status, gerencia_da_via, trecho_da_via, sub_trecho,
                ativo, atividade, tipo, data,
                inicio_prog, inicio_real, fim_prog, fim_real,
                tempo_prog, tempo_real, -- Colunas de Duração
                local_prog, local_real, producao_prog, producao_real,
                detalhe_local
            FROM atividades
            WHERE data = :data_ref
            ORDER BY inicio_prog ASC
        """)

        try:
            with engine.connect() as conn:
                result = conn.execute(query, {"data_ref": data_ref})
                rows = result.mappings().all()
                dashboard_data = []
                
                for row in rows:
                    def fmt_time(t):
                        if not t: return "--:--"
                        # Formata HH:MM se for objeto time, ou corta string
                        return t.strftime('%H:%M') if hasattr(t, 'strftime') else str(t)[:5]

                    status_val = row['status']

                    item = {
                        "id": row['id'],
                        "data": row['data'].strftime('%d/%m') if row['data'] else "--/--",
                        "status": status_val,
                        
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
                            # Agora usa os dados reais do Excel ("Duração" e "TOTAL")
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
            print(f"Erro no DashboardService: {e}")
            return []