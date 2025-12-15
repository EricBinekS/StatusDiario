from backend.db.connection import get_db_connection
from sqlalchemy import text
from datetime import datetime

class DashboardService:
    @staticmethod
    def get_dashboard_data(data_ref=None):
        engine = get_db_connection()
        
        # Se não vier data, usa a de hoje
        if not data_ref:
            data_ref = datetime.now().strftime('%Y-%m-%d')

        # Query ajustada para pegar os campos necessários
        query = text("""
            SELECT 
                id,
                status,
                gerencia_da_via as gerencia,
                trecho_da_via as trecho,
                sub_trecho as sub,
                ativo,
                atividade,
                tipo,
                data,
                inicio_prog, inicio_real,
                fim_prog, fim_real,
                local_prog, local_real,
                producao_prog, producao_real,
                unidade,
                detalhe_local as detalhe
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
                    # 1. TRADUÇÃO DE STATUS (Texto -> ID Numérico para o Frontend)
                    # 2=Verde (Concluído), 1=Amarelo (Andamento), 0=Vermelho (Cancelado), 3=Cinza (Prog)
                    status_code = 3 
                    st_text = str(row['status']).upper() if row['status'] else ""
                    
                    if st_text in ['CONCLUIDO', 'CONCLUÍDO', 'EXECUTADO', 'FINALIZADO']:
                        status_code = 2
                    elif st_text in ['EM ANDAMENTO', 'INICIADO', 'EXECUÇÃO']:
                        status_code = 1
                    elif st_text in ['CANCELADO', 'NÃO EXECUTADO', 'FALHA', 'SUSPENSO']:
                        status_code = 0
                    
                    # 2. HELPER DE DATA/HORA
                    def fmt_time(t):
                        return str(t)[:5] if t else "--:--"

                    # 3. MONTAGEM DO OBJETO (Formato "Painel de Avião")
                    item = {
                        "id": row['id'],
                        "data": row['data'].strftime('%d/%m') if row['data'] else "--/--",
                        "status": status_code, 
                        
                        # Campos para Filtros
                        "gerencia": row['gerencia'] or "",
                        "trecho": row['trecho'] or "",
                        "sub": row['sub'] or "",
                        "tipo": row['tipo'] or "",
                        
                        # Campos de Exibição
                        "ativo": row['ativo'] or "N/A",
                        "atividade": row['atividade'] or "Sem descrição",
                        "detalhe": row['detalhe'] or "",
                        
                        # Objetos Aninhados (Prog vs Real)
                        "inicio": {
                            "prog": fmt_time(row['inicio_prog']),
                            "real": fmt_time(row['inicio_real'])
                        },
                        "tempo": {
                            "prog": "00:00", # Pode implementar cálculo de delta depois
                            "real": "00:00",
                            "isTimer": status_code == 1 # Ativa pisca-pisca se estiver em andamento
                        },
                        "local": {
                            "prog": row['local_prog'] or "-",
                            "real": row['local_real'] or "-"
                        },
                        "quant": {
                            "prog": f"{row['producao_prog'] or 0} {row['unidade'] or ''}".strip(),
                            "real": f"{row['producao_real'] or 0} {row['unidade'] or ''}".strip()
                        }
                    }
                    dashboard_data.append(item)
                
                return dashboard_data

        except Exception as e:
            print(f"Erro no DashboardService: {e}")
            # Em produção, use logging ao invés de print
            return []