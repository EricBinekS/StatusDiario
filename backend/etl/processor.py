import pandas as pd
import numpy as np
import hashlib
import datetime
from unidecode import unidecode

FINAL_COLUMNS = [
    'row_hash', 'status', 'operational_status', 'gerencia_da_via', 'ativo', 
    'atividade', 'tipo', 'data', 'inicio_prog', 'inicio_real', 'fim_prog', 'fim_real',
    'tempo_prog', 'tempo_real', 'local_prog', 'local_real', 'detalhamento'
]

ATIVOS_MODERNIZACAO = [
    "MODERNIZACAO", "MODERNIZAÇÃO", "DESGUARNECEDORA", "TIETE", 
    "PIRACICABA", "CAPIVARI"
]

def normalize_str(s):
    """Remove acentos, espaços e padroniza para upper."""
    if pd.isna(s) or s == "":
        return None
    return unidecode(str(s)).strip().upper()

def make_row_id(row):
    """Gera hash único para a linha."""
    # Combinação de campos que tornam a linha única
    raw = f"{row.get('data')}-{row.get('ativo')}-{row.get('atividade')}-{row.get('inicio_prog')}-{row.get('local_prog')}"
    return hashlib.md5(raw.encode('utf-8')).hexdigest()

def clean_column_names(header_row):
    """Limpa cabeçalho do Excel para snake_case."""
    clean = []
    for col in header_row:
        if pd.isna(col):
            clean.append(f"col_{len(clean)}")
        else:
            c = unidecode(str(col)).lower().strip().replace(" ", "_").replace(".", "").replace("/", "_")
            clean.append(c)
    return clean

def transform_dataframe(df):
    """
    Aplica todas as regras de negócio complexas do seu Raw Data antigo.
    """
    if df.empty: return df

    rename_map = {
        'programar_para_d1': 'tipo',
        'programar_para_d_1': 'tipo',
        'gerencia_da_via13': 'gerencia_da_via',
        'coordenacao_da_via': 'coordenacao', 
    }
    df = df.rename(columns=rename_map)

    # 2. Normalização de Texto
    for col in ['ativo', 'atividade', 'tipo', 'gerencia_da_via', 'status']:
        if col in df.columns:
            df[col] = df[col].apply(normalize_str)

    df['data'] = pd.to_datetime(df['data'], errors='coerce')
    df = df.dropna(subset=['data']) 

    def combine_date_time(date_val, time_val):
        if pd.isna(time_val) or str(time_val).strip() == '':
            return None
        
        if isinstance(time_val, (datetime.datetime, pd.Timestamp)):
            return time_val
        
        try:
            time_str = str(time_val).split(' ')[-1] 
            h, m, s = map(int, time_str.split(':'))
            return date_val.replace(hour=h, minute=m, second=s)
        except:
            return None

    if 'inicio_real' in df.columns:
        pass 

    # 4. Regra: Modernização (Hardcoded)
    if 'ativo' in df.columns and 'gerencia_da_via' in df.columns:
        mask_mod = df['ativo'].astype(str).apply(lambda x: any(m in x for m in ATIVOS_MODERNIZACAO))
        df.loc[mask_mod, 'gerencia_da_via'] = "MODERNIZACAO"

    # 5. Regra: Status Operacional
    # Derivamos se está concluído ou não baseado no preenchimento do Realizado
    if 'status' not in df.columns:
        df['status'] = 'PROGRAMADO' # Default
        
    if 'inicio_real' in df.columns and 'fim_real' in df.columns:
        # Se tem fim real, está concluído
        mask_concluido = df['fim_real'].notna() & (df['fim_real'] != '')
        df.loc[mask_concluido, 'status'] = 'CONCLUIDO'
        
        # Se tem inicio mas não fim, está em andamento
        mask_andamento = df['inicio_real'].notna() & df['fim_real'].isna()
        df.loc[mask_andamento, 'status'] = 'EM ANDAMENTO'

    # Coluna extra para compatibilidade com Dashboard antigo
    df['operational_status'] = df['status']

    # 6. Geração de ID e Limpeza Final
    df['row_hash'] = df.apply(make_row_id, axis=1)

    # Garante colunas finais
    for col in FINAL_COLUMNS:
        if col not in df.columns:
            df[col] = None

    return df[FINAL_COLUMNS].drop_duplicates(subset=['row_hash'])