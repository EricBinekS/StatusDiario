from sqlalchemy import text
from backend.db.connection import get_db_engine
from datetime import datetime, time
import pytz

def get_dashboard_data(filters=None):
    engine = get_db_engine()
    if not engine:
        return []

    # 1. Determina a data alvo
    target_date = None
    if filters and filters.get('data'):
        target_date = filters.get('data')
    else:
        # Se não vier data, busca a mais recente no banco
        try:
            with engine.connect() as conn:
                conn.execute(text("SET statement_timeout = 5000;"))
                target_date = conn.execute(text("SELECT MAX(data) FROM atividades")).scalar()
        except Exception as e:
            print(f"Erro ao buscar data máxima: {e}")

    if not target_date:
        target_date = datetime.now().strftime('%Y-%m-%d')

    # 2. Configuração de Fuso Horário e Lógica de Detalhamento
    # Define o fuso de Brasília e o horário de corte (12:00)
    tz_brazil = pytz.timezone('America/Sao_Paulo')
    agora = datetime.now(tz_brazil)
    meio_dia = time(12, 0, 0)
    
    try:
        # Converte a data alvo (string ou date) para objeto date
        if isinstance(target_date, str):
            data_ref_date = datetime.strptime(target_date, '%Y-%m-%d').date()
        else:
            data_ref_date = target_date

        hoje_date = agora.date()
        
        eh_manha = False
        if data_ref_date == hoje_date:
            # É hoje: verifica se é antes do meio-dia
            if agora.time() < meio_dia:
                eh_manha = True
        elif data_ref_date > hoje_date:
             # É futuro: considera manhã (previsão inicial)
             eh_manha = True
        # Se for passado (data_ref < hoje), eh_manha fica False
    except Exception:
        eh_manha = True # Fallback seguro

    # 3. Query Principal
    query = text("""
        SELECT 
            id, row_hash, status, gerencia_da_via, trecho_da_via, sub_trecho,
            ativo, atividade, tipo, data,
            inicio_prog, inicio_real, fim_prog, fim_real,
            tempo_prog, tempo_real,
            local_prog, local_real, producao_prog, producao_real,
            detalhe_local, status_1, status_2
        FROM atividades
        WHERE data = :data_ref
        ORDER BY status ASC, inicio_prog ASC
    """)

    try:
        with engine.connect() as conn:
            # Blindagem contra timeout (60s para carga pesada)
            conn.execute(text("SET statement_timeout = 60000;"))
            
            result = conn.execute(query, {"data_ref": target_date})
            rows = result.mappings().all()
        
        if not rows:
            return []

        dashboard_data = []

        # --- FUNÇÕES DE FORMATAÇÃO ---
        def fmt_val(v):
            return str(v) if v is not None else ""
            
        def fmt_time(t):
            if not t: return "--:--"
            return str(t)[:5] # Pega HH:MM

        def fmt_date(d):
            """Formata para DD/MM removendo ano e horas"""
            if not d: return "--/--"
            try:
                # Se for objeto datetime/date do Python
                if hasattr(d, 'strftime'):
                    return d.strftime('%d/%m') # ALTERADO AQUI
                
                # Se for string (ex: '2026-01-02 00:00:00')
                s = str(d)
                if ' ' in s: 
                    s = s.split(' ')[0] # Remove o tempo
                
                if '-' in s:
                    parts = s.split('-')
                    if len(parts) == 3:
                        # Converte YYYY-MM-DD para DD/MM
                        return f"{parts[2]}/{parts[1]}" # ALTERADO AQUI
                return s
            except:
                return str(d)

        for row in rows:
            # Lógica de Detalhamento no Backend
            val_status_1 = row['status_1']
            val_status_2 = row['status_2']
            val_detalhe = row['detalhe_local'] or ""
            
            detalhamento_final = ""
            
            if eh_manha:
                # Manhã: Prioridade para Status 1 (Previa 1) -> Detalhe Local
                detalhamento_final = val_status_1 if val_status_1 else val_detalhe
            else:
                # Tarde: Prioridade Status 2 (Previa 2) -> Status 1 -> Detalhe
                if val_status_2:
                    detalhamento_final = val_status_2
                elif val_status_1:
                    detalhamento_final = val_status_1
                else:
                    detalhamento_final = val_detalhe

            # Montagem do objeto final
            item = {
                "id": row['id'] or row['row_hash'],
                "row_hash": row['row_hash'],
                "status": row['status'],
                "data": fmt_date(row['data']), # Usa a formatação curta
                
                "gerencia": fmt_val(row['gerencia_da_via']),
                "trecho": fmt_val(row['trecho_da_via']),
                "sub": fmt_val(row['sub_trecho']),
                "tipo": fmt_val(row['tipo']),
                "ativo": fmt_val(row['ativo']) or "N/A",
                "atividade": fmt_val(row['atividade']),
                
                "detalhamento": detalhamento_final,
                
                "inicio": {
                    "prog": fmt_time(row['inicio_prog']),
                    "real": fmt_time(row['inicio_real'])
                },
                "fim": {
                    "prog": fmt_time(row['fim_prog']),
                    "real": fmt_time(row['fim_real'])
                },
                "tempo": {
                    "prog": fmt_time(row['tempo_prog']),
                    "real": fmt_time(row['tempo_real'])
                },
                "local": {
                    "prog": row['local_prog'] or "-",
                    "real": row['local_real'] or "-"
                },
                "quant": {
                    "prog": row['producao_prog'] or 0,
                    "real": row['producao_real'] or 0
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
            conn.execute(text("SET statement_timeout = 5000;"))
            result = conn.execute(query).scalar()
            
            if result:
                iso_time = result.isoformat()
                if not iso_time.endswith('Z') and '+' not in iso_time:
                    iso_time += 'Z'
                return {"last_updated_at": iso_time}
            return {"last_updated_at": None}
    except Exception:
        return {"last_updated_at": None}