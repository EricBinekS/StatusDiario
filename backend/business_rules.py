from datetime import datetime, date
import re

COL_MAPPINGS = {
    'status': ['status'],
    'status_1': ['previa___1'],
    'status_2': ['previa___2'],
    'inicio_prog': ['inicia'],
    'inicio_real': ['inicio'],
    'fim_real': ['fim'],
    'tempo_prog': ['duracao'],
    'tempo_real': ['total'],
    'local_prog': ['sb'],
    'local_real': ['sb_4'],
    'sub_trecho': ['sub_5'],
    'trecho_da_via': ['coordenacao_da_via_14'],
    'gerencia_da_via': ['gerencia_da_via_13'],
    'producao_prog': ['quantidade'],
    'producao_real': ['quantidade_11'],
    'tipo': ['programar_para_d+1'],
    'data': ['data']
}

ATIVIDADES_IGNORADAS = [
    "MECANIZAÇÃO - ESMERILHADORA", "DESLOCAMENTO", "DETECÇÃO - RONDA 7 DIAS", 
    "INSPEÇÃO AUTO DE LINHA", "EXPANSÃO - ALÍVIO DE TENSÃO", "EXPANSÃO - AMV - JACARÉ", 
    "EXPANSÃO - AMV - MEIA CHAVE", "EXPANSÃO - DESCARGA - TRILHO", "EXPANSÃO - DORMENTE - CARGA", 
    "EXPANSÃO - DORMENTE - DESCARGA", "EXPANSÃO - OUTRA ATIVIDADE", "EXPANSÃO - TRILHEIRO - DESCARGA", 
    "EXPANSÃO - PEDRA - CARGA", "EXPANSÃO - PEDRA - DESCARGA", "EXPANSÃO - SOLDA"
]

GERENCIAS_IGNORADAS = ["MALHA CENTRAL"]
ATIVOS_IGNORADOS = ["V66"]

ATIVOS_MODERNIZACAO = [
    "ModernizaçãoTURMA2", "ModernizaçãoLASTRO2", "MOD ZYQ ZWI", "MOD ZWU ZDC",
    "MODERNIZAÇÃO TURMA 2", "MOD ZDG PAT", "MOD ZRB ZEV", "MOD ZEM",
    "MOD SPN", "MODERNIZAÇÃO ZGP", "MODERNIZAÇÃO SERRA", "MOD ZGP", "MOD FN", "MOD SPN",
]

ATIVIDADES_MODERNIZACAO = [
    "MODERNIZAÇÃO - PEDRA - DESCARGA", "MODERNIZAÇÃO - OUTRA ATIVIDADE",
    "MODERNIZAÇÃO - SOLDA", "MODERNIZAÇÃO - RECOLHIMENTO DE DORMENTE",
    "MODERNIZAÇÃO - TRILHO - DESCARGA", "MODERNIZAÇÃO - SOCADORA",
    "MODERNIZAÇÃO - DORMENTE - DESCARGA", "MODERNIZAÇÃO - SUBSTITUIÇÃO DE DORMENTE",
    "MODERNIZAÇÃO - PEDRA - CARGA", "MODERNIZAÇÃO - DESCARGA - TRILHO"
]

def calculate_status_from_production(status_code, p_prog, p_real):
    try:
        st = int(float(status_code))
    except:
        return 'NAO_INICIADO'
    
    if st == 0: return 'CANCELADO'
    if st == 1: return 'ANDAMENTO'
    
    if st == 2:
        if p_prog == 0: 
            return 'CONCLUIDO' if p_real > 0 else 'CANCELADO'
        
        percent = p_real / p_prog
        
        if percent <= 0.49: return 'CANCELADO'
        elif percent <= 0.90: return 'PARCIAL'
        else: return 'CONCLUIDO'
    
    return 'NAO_INICIADO'

HORA_CORTE_VISUALIZACAO = 12

def select_display_message(row_date, status_1, status_2):
    today = datetime.now().date()
    current_hour = datetime.now().hour
    
    if isinstance(row_date, str):
        try:
            row_date = datetime.strptime(row_date, '%Y-%m-%d').date()
        except:
            row_date = today
    elif isinstance(row_date, datetime):
        row_date = row_date.date()
        
    s1 = status_1 or ''
    s2 = status_2 or ''

    if row_date < today:
        return s2 if s2 else s1
    elif row_date > today:
        return s1
    else:
        if current_hour >= HORA_CORTE_VISUALIZACAO:
            return s2 if s2 else s1
        else:
            return s1

SQL_CONSTANTS = {
    'contract_pattern': '%CONTRATO%'
}

def is_valid_entry(value):
    if value is None: return False
    s = str(value).strip()
    if not s: return False
    if s in ['-', '--', '.', '?', 'N/A', 'NULL', '0']: return False
    if re.match(r'^[\W_]+$', s): return False
    return True