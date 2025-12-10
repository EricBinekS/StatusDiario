import pandas as pd
import datetime
import re
import hashlib
from zoneinfo import ZoneInfo
from ..scripts.utils import flexible_time_to_datetime, clean_column_names, format_timedelta_to_hhmm, normalize_str

BR_TZ = ZoneInfo("America/Sao_Paulo")

# --- CONSTANTES ---

ATIVOS_MODERNIZACAO = [
    "MODERNIZAÇÃOTURMA2",
    "MODERNIZAÇÃOLASTRO2",
    "MOD ZYQ ZWI",
    "MOD ZWU ZDC",
    "MODERNIZAÇÃO TURMA 2",
    "MOD ZDG PAT",
    "MOD ZRB ZEV",
    "MOD ZEM",
    "MOD SPN",
    "MODERNIZAÇÃO ZGP",
    "MODERNIZAÇÃO SERRA",
    "MOD ZGP",
    "MOD FN"
]
# Normaliza para comparação
ATIVOS_MODERNIZACAO = [x.strip().upper() for x in ATIVOS_MODERNIZACAO]


# --- Funções de Transformação de Colunas ---

def _create_full_datetime(row, time_col_name, date_col_name='data'):
    date_obj = row.get(date_col_name)
    time_val = row.get(time_col_name)
    if pd.isna(date_obj) or pd.isna(time_val):
        return None
    time_dt = flexible_time_to_datetime(time_val)
    if not time_dt:
        return None
    try:
        base_date = date_obj.date()
        full_dt = datetime.datetime.combine(base_date, time_dt.time())
        return pd.to_datetime(full_dt)
    except Exception:
        return None

def calculate_end_datetime(row):
    start_dt = row.get('start_real_dt')
    if pd.isna(start_dt):
        return None
    end_time_cols = ['fim', 'fim_8', 'fim_10']
    end_time_val = None
    for col in end_time_cols:
        val = row.get(col)
        if pd.notna(val) and val != '':
            end_time_val = val
            break
    if end_time_val is None:
        return None
    end_time_dt_obj = flexible_time_to_datetime(end_time_val)
    if not end_time_dt_obj:
        return None
    end_dt_naive = datetime.datetime.combine(start_dt.date(), end_time_dt_obj.time())
    start_dt_naive = start_dt.replace(tzinfo=None) if start_dt.tzinfo else start_dt
    if end_dt_naive < start_dt_naive:
        end_dt_naive += datetime.timedelta(days=1)
    return pd.to_datetime(end_dt_naive)

def calculate_detalhamento_by_time(row, now_aware):
    activity_date = row.get('data') 
    if pd.isna(activity_date):
        return row.get('prévia_1')
    try:
        cutoff_time_naive = datetime.datetime.combine(activity_date.date(), datetime.time(12, 0))
        cutoff_time_aware = cutoff_time_naive.replace(tzinfo=BR_TZ)
    except Exception:
        return row.get('prévia_1')
    if now_aware < cutoff_time_aware:
        return row.get('prévia_1')
    else:
        return row.get('prévia_2')

def calculate_operational_status(row):
    override_status = row.get('tempo_real_override')
    if override_status == 'ESP':
        return 'Cancelado (ESP)'
    if override_status == 'BLOCO':
        return 'Cancelado (BLOCO)'
    if pd.notna(row.get('end_real_dt')) and pd.notna(row.get('start_real_dt')):
        return 'Concluído'
    elif pd.notna(row.get('start_real_dt')):
        return 'Em Andamento'
    else:
        return 'Programado'

def make_row_id(row):
    key = f"{row.get('ativo','')}|{row.get('atividade','')}|{row.get('data','')}|{row.get('inicio_real','')}|{row.get('gerencia_da_via', '')}"
    return hashlib.sha1(key.encode('utf-8')).hexdigest()

# --- Função Principal de Transformação ---

def transform_dataframe(df):
    
    # Pré-processamento e limpeza básica
    required_cols = ['data', 'ativo']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"  -> ERRO: Colunas requeridas faltando: {missing_cols}. DataFrame descartado.")
        return pd.DataFrame()

    df = df.where(pd.notnull(df), None)
    df['data'] = pd.to_datetime(df['data'], errors='coerce')
    df.dropna(subset=['data'], inplace=True)

    # --- NOVA REGRA: MODERNIZAÇÃO (GLOBAL) ---
    # Aplica a alteração de gerência aqui para refletir em todo o app (Dashboard e Overview)
    coluna_gerencia = 'gerência_da_via' if 'gerência_da_via' in df.columns else 'gerencia_da_via'
    
    if coluna_gerencia in df.columns:
        # Garante que a coluna seja string para evitar erros
        df[coluna_gerencia] = df[coluna_gerencia].astype(str)
        
        # Cria mascara (filtro) para os ativos de modernização
        mask_modernizacao = df['ativo'].astype(str).str.strip().str.upper().isin(ATIVOS_MODERNIZACAO)
        
        # Aplica a substituição
        df.loc[mask_modernizacao, coluna_gerencia] = 'MODERNIZAÇÃO'

    now_aware = datetime.datetime.now(BR_TZ)

    # Cálculo de Timestamps
    df['start_prog_dt'] = df.apply(_create_full_datetime, args=('inicia',), axis=1)
    df['start_real_dt'] = df.apply(_create_full_datetime, args=('inicio',), axis=1)
    df['duration_dt'] = df.apply(lambda row: flexible_time_to_datetime(row.get('duração')), axis=1)
    df['end_real_dt'] = df.apply(calculate_end_datetime, axis=1)

    # Formatação de Tempo (HH:MM)
    df['inicio_prog'] = df['start_prog_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)
    df['inicio_real'] = df['start_real_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)
    df['tempo_prog'] = df['duration_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)

    # Cálculo de tempo real a partir de Timedelta
    mask = df['start_real_dt'].notna() & df['end_real_dt'].notna()
    df.loc[mask, 'tempo_real_td'] = df.loc[mask, 'end_real_dt'] - df.loc[mask, 'start_real_dt']
    df['tempo_real'] = df.get('tempo_real_td', pd.Series(index=df.index)).apply(format_timedelta_to_hhmm)
    df.drop(columns=['tempo_real_td'], inplace=True, errors='ignore')

    # Timestamps ISO para o Frontend
    df['timer_start_timestamp'] = df['start_real_dt'].apply(lambda dt: dt.isoformat() if pd.notna(dt) else None)
    df['timer_end_timestamp'] = df['end_real_dt'].apply(lambda dt: dt.isoformat() if pd.notna(dt) else None)

    # Campos de Local e Quantidade
    clean_local = lambda x: re.split(r'[/\\]', str(x))[0].strip() if pd.notna(x) else None
    df['local_prog'] = df.get('sb', pd.Series(index=df.index)).apply(clean_local)
    df['local_real'] = df.get('sb_4', pd.Series(index=df.index)).apply(clean_local)
    df['quantidade_prog'] = df.get('quantidade')
    df['quantidade_real'] = df.get('quantidade_11')

    # Detalhamento
    df['detalhamento'] = df.apply(calculate_detalhamento_by_time, args=(now_aware,), axis=1)

    # Override de Status (ESP/BLOCO)
    df['tempo_real_override'] = None
    end_time_cols = ['fim', 'fim_8', 'fim_10']
    valid_end_cols = [col for col in end_time_cols if col in df.columns]
    
    if valid_end_cols:
        df['fim_val'] = df[valid_end_cols].bfill(axis=1).iloc[:, 0]
        df['fim_time_obj'] = df['fim_val'].apply(
            lambda x: flexible_time_to_datetime(x).time()
            if pd.notna(x) and flexible_time_to_datetime(x) is not None
            else None
        )

        cond_esp = df['fim_time_obj'] == datetime.time(1, 0)
        df.loc[cond_esp, 'tempo_real_override'] = 'ESP'
        df.loc[cond_esp, ['timer_start_timestamp', 'timer_end_timestamp', 'tempo_real']] = None

        cond_bloco = df['fim_time_obj'] == datetime.time(0, 1)
        df.loc[cond_bloco, 'tempo_real_override'] = 'BLOCO'
        df.loc[cond_bloco, ['timer_start_timestamp', 'timer_end_timestamp', 'tempo_real']] = None

        df = df.drop(columns=['fim_val', 'fim_time_obj'], errors='ignore')

    # Status Final
    df['operational_status'] = df.apply(calculate_operational_status, axis=1)
    if 'status' not in df.columns:
        df['status'] = 'N/A'

    df['data'] = df['data'].dt.strftime('%Y-%m-%d')
    return df