from sqlalchemy import text
from backend.db.connection import get_db_engine
from datetime import datetime, timedelta
import re

def parse_time_to_hours(time_str):
    if not time_str: return 0.0
    try:
        parts = str(time_str).split(':')
        h = int(parts[0])
        m = int(parts[1])
        return h + (m / 60.0)
    except:
        return 0.0

def get_status_key(db_status):
    if not db_status: return 'nao_iniciado'
    s = str(db_status).upper().strip()
    mapping = {
        'CONCLUIDO': 'concluido',
        'PARCIAL': 'parcial',
        'ANDAMENTO': 'andamento',
        'NAO_INICIADO': 'nao_iniciado',
        'CANCELADO': 'cancelado'
    }
    return mapping.get(s, 'nao_iniciado')

def is_valid_entry(value):
    if value is None: return False
    s = str(value).strip()
    if not s: return False
    if s in ['-', '--', '.', '?', 'N/A', 'NULL', '0']: return False
    if re.match(r'^[\W_]+$', s): return False
    return True

def process_row_for_target(row, target, day_label):
    tipo_raw = str(row['tipo'] or '').upper()
    type_key = 'contrato' if 'CONTRATO' in tipo_raw else 'oportunidade'
    group = target["types"][type_key]

    h_prog = parse_time_to_hours(row['tempo_prog'])
    h_real = parse_time_to_hours(row['tempo_real'])
    status_key = get_status_key(row['status'])

    group["kpis"]["prog_h"] += h_prog
    group["kpis"]["real_h"] += h_real
    group["kpis"]["prog_int"] += 1
    
    if status_key in ['concluido', 'parcial']: 
        group["kpis"]["real_int"] += 1

    if status_key in group["kpis"]["breakdown"]:
        group["kpis"]["breakdown"][status_key] += 1

    day_point = next((p for p in group["chartData"] if p["name"] == day_label), None)
    if not day_point:
        day_point = {"name": day_label, "prog": 0, "real": 0}
        group["chartData"].append(day_point)
    
    day_point["prog"] += h_prog
    day_point["real"] += h_real

    # REMOVIDO: IGNORED_ACTIVITIES
    # Aderência calcula para todas as atividades que chegam aqui
    if status_key in ['concluido', 'parcial', 'cancelado']:
        group["meta_calc"]["total_valid"] += 1
        if status_key == 'concluido':
            group["meta_calc"]["points"] += 1.0
        elif status_key == 'parcial':
            group["meta_calc"]["points"] += 0.5

def get_overview_data(view_mode='semana'):
    engine = get_db_engine()
    if not engine: return []

    today = datetime.now().date()
    start_date = today
    end_date = today

    if view_mode == 'hoje':
        start_date = today
        end_date = today
    elif view_mode == 'semana':
        start_date = today - timedelta(days=today.weekday()) 
        end_date = start_date + timedelta(days=6)
    elif view_mode == 'mes':
        start_date = today.replace(day=1)
        next_month = today.replace(day=28) + timedelta(days=4)
        end_date = next_month - timedelta(days=next_month.day)

    sql = """
        SELECT 
            gerencia_da_via, atividade, tipo, data, status,
            tempo_prog, tempo_real, inicio_real
        FROM atividades
        WHERE data >= :start AND data <= :end
    """
    
    agg = {}
    
    ATIVIDADES_MECANIZACAO = [
        "MECANIZACAO", "MECANIZAÇÃO", "SOCADORA", "REGULADORA", "ESMERILHADORA", 
        "DESGUARNECEDORA", "ESTABILIZADORA", "CAPINA QUÍMICA", "CAPINA QUIMICA"
    ]

    try:
        with engine.connect() as conn:
            result = conn.execute(text(sql), {
                "start": start_date.strftime('%Y-%m-%d'),
                "end": end_date.strftime('%Y-%m-%d')
            })
            rows = result.mappings().all()

            for row in rows:
                if not is_valid_entry(row['gerencia_da_via']):
                    continue

                gerencia_raw = row['gerencia_da_via'].upper()
                ger_id = gerencia_raw.replace(' ', '_').lower()

                if ger_id not in agg:
                    agg[ger_id] = init_gerencia_structure(ger_id, gerencia_raw)
                
                if view_mode == 'hoje':
                    time_val = row.get('inicio_real')
                    if time_val:
                        time_str = str(time_val)
                        hour_prefix = time_str.split(':')[0]
                        day_label = f"{hour_prefix}h"
                    else:
                        day_label = "N/I" 
                else:
                    row_date_str = str(row['data'])
                    try:
                        dt_obj = row['data'] if isinstance(row['data'], datetime) else datetime.strptime(str(row['data'])[:10], '%Y-%m-%d')
                        day_label = dt_obj.strftime('%d/%m')
                    except:
                        day_label = row_date_str

                process_row_for_target(row, agg[ger_id], day_label)

                ativ_upper = (row['atividade'] or '').upper()
                is_mecanizacao = any(k in ativ_upper for k in ATIVIDADES_MECANIZACAO)
                
                if is_mecanizacao:
                    mec_id = 'mecanizacao_extra'
                    if mec_id not in agg:
                        agg[mec_id] = init_gerencia_structure(mec_id, 'MECANIZAÇÃO')
                    process_row_for_target(row, agg[mec_id], day_label)
            
            final_data = []
            for gid, data in agg.items():
                for tkey in ['contrato', 'oportunidade']:
                    tdata = data["types"][tkey]
                    
                    tdata["kpis"]["prog_h"] = round(tdata["kpis"]["prog_h"], 1)
                    tdata["kpis"]["real_h"] = round(tdata["kpis"]["real_h"], 1)
                    
                    total = tdata["meta_calc"]["total_valid"]
                    points = tdata["meta_calc"]["points"]
                    if total > 0:
                        tdata["percentual"] = round((points / total) * 100, 1)
                    else:
                        tdata["percentual"] = 0 
                    
                    tdata["chartData"].sort(key=lambda x: x["name"])
                    del tdata["meta_calc"]

                final_data.append(data)
            
            final_data.sort(key=lambda x: (x["id"] == 'mecanizacao_extra', x["title"]))
            
            return final_data

    except Exception as e:
        print(f"🔴 Erro no OverviewService: {e}")
        return []

def init_gerencia_structure(gid, title):
    return {
        "id": gid,
        "title": title,
        "types": {
            "contrato": init_type_structure(),
            "oportunidade": init_type_structure()
        }
    }

def init_type_structure():
    return {
        "percentual": 0,
        "meta": 85,
        "kpis": {
            "prog_h": 0, "real_h": 0,
            "prog_int": 0, "real_int": 0,
            "breakdown": {
                "concluido": 0, "parcial": 0, "andamento": 0, 
                "nao_iniciado": 0, "cancelado": 0
            }
        },
        "chartData": [],
        "meta_calc": { "points": 0, "total_valid": 0 }
    }