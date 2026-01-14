import pandas as pd
import numpy as np
import hashlib
import re
from datetime import datetime
# Importa as regras de negócio
from backend.business_rules import (
    COL_MAPPINGS, ATIVIDADES_IGNORADAS, GERENCIAS_IGNORADAS, 
    ATIVOS_IGNORADOS, ATIVOS_MODERNIZACAO, ATIVIDADES_MODERNIZACAO,
    calculate_status_from_production
)

def clean_column_names(header_row):
    """Retorna nomes limpos e únicos para o cabeçalho."""
    if hasattr(header_row, 'tolist'):
        header_list = header_row.tolist()
    else:
        header_list = list(header_row)
    
    def _clean(text):
        if pd.isna(text) or text == "": return "coluna_vazia"
        return (str(text).strip().lower()
                .replace(' ', '_').replace('-', '_')
                .replace('ç', 'c').replace('ã', 'a').replace('á', 'a')
                .replace('à', 'a').replace('é', 'e').replace('ê', 'e')
                .replace('í', 'i').replace('ó', 'o').replace('ô', 'o')
                .replace('ú', 'u').replace('/', '_').replace('.', '')
                .replace('(', '').replace(')', '').replace('\n', '_'))

    cleaned = [_clean(col) for col in header_list]
    
    seen = {}
    final_cols = []
    for col in cleaned:
        if col in seen:
            seen[col] += 1
            final_cols.append(f"{col}_{seen[col]}")
        else:
            seen[col] = 0
            final_cols.append(col)
            
    return final_cols

def find_column(df, candidates):
    """Procura a primeira ocorrência de uma coluna candidata no DataFrame."""
    for col in candidates:
        if col in df.columns:
            return col
    for col in df.columns:
        for cand in candidates:
            if cand in col and len(col) < len(cand) + 4: 
                return col
    return None

def process_dataframe(df):
    try:
        # 1. FILTRAR LINHAS VAZIAS E RENOMEAR COLUNA ATIVO
        col_ativo = find_column(df, ['ativo', 'prefixo', 'locomotiva'])
        
        if col_ativo:
            df = df.dropna(subset=[col_ativo])
            df = df[df[col_ativo].astype(str).str.strip() != '']
            df.rename(columns={col_ativo: 'ativo'}, inplace=True)
        
        # 2. MAPEAMENTO DE COLUNAS 
        rename_dict = {}
        for target, candidates in COL_MAPPINGS.items():
            found = find_column(df, candidates)
            if found:
                rename_dict[found] = target
        
        for source, target in rename_dict.items():
            if target in df.columns and source != target:
                df.drop(columns=[target], inplace=True)
        # --------------------------------------------

        df.rename(columns=rename_dict, inplace=True)

        # 3. FILTROS DE NEGÓCIO
        if 'atividade' in df.columns:
            pattern = '|'.join([re.escape(x) for x in ATIVIDADES_IGNORADAS])
            df = df[~df['atividade'].astype(str).str.contains(pattern, case=False, na=False)]

        if 'gerencia_da_via' in df.columns:
            pattern_ger = '|'.join([re.escape(x) for x in GERENCIAS_IGNORADAS])
            df = df[~df['gerencia_da_via'].astype(str).str.contains(pattern_ger, case=False, na=False)]

        if 'ativo' in df.columns and ATIVOS_IGNORADOS:
            pattern_ativo = '|'.join([re.escape(x) for x in ATIVOS_IGNORADOS])
            if pattern_ativo:
                df = df[~df['ativo'].astype(str).str.contains(pattern_ativo, case=False, na=False)]

        # 4. TRATAMENTO DE STATUS
        if 'status' not in df.columns:
            df['status'] = 'NAO_INICIADO'
        else:
            def _wrapper_status(row):
                raw_status = row.get('status')
                if pd.isna(raw_status) or str(raw_status).strip() == '': 
                    return 'NAO_INICIADO'

                def parse_prod(val):
                    try:
                        if pd.isna(val) or str(val).strip() == '': return 0.0
                        return float(str(val).replace(',', '.'))
                    except:
                        return 0.0

                p_prog = parse_prod(row.get('producao_prog'))
                p_real = parse_prod(row.get('producao_real'))
                
                return calculate_status_from_production(raw_status, p_prog, p_real)

            df['status'] = df.apply(_wrapper_status, axis=1)

        # 5. CÁLCULO FIM PROGRAMADO
        if 'inicio_prog' in df.columns and 'tempo_prog' in df.columns:
            start_dt = pd.to_datetime(df['inicio_prog'].astype(str), format='%H:%M:%S', errors='coerce')
            duration_dt = pd.to_datetime(df['tempo_prog'].astype(str), format='%H:%M:%S', errors='coerce')
            
            dummy_date = datetime(2000, 1, 1)
            if not start_dt.isna().all() and not duration_dt.isna().all():
                start_delta = pd.to_timedelta(start_dt.dt.strftime('%H:%M:%S'))
                duration_delta = pd.to_timedelta(duration_dt.dt.strftime('%H:%M:%S'))
                final_dt = dummy_date + start_delta + duration_delta
                df['fim_prog'] = final_dt.dt.time
            else:
                df['fim_prog'] = None
        else:
            df['fim_prog'] = None

        # 6. REGRA MODERNIZAÇÃO
        if 'ativo' not in df.columns: df['ativo'] = ''
        if 'gerencia_da_via' not in df.columns: df['gerencia_da_via'] = None
        if 'atividade' not in df.columns: df['atividade'] = ''

        mask_mod_ativo = df['ativo'].astype(str).str.strip().isin(ATIVOS_MODERNIZACAO)
        df.loc[mask_mod_ativo, 'gerencia_da_via'] = 'MODERNIZAÇÃO'

        mask_mod_atividade = df['atividade'].astype(str).str.strip().isin(ATIVIDADES_MODERNIZACAO)
        df.loc[mask_mod_atividade, 'gerencia_da_via'] = 'MODERNIZAÇÃO'

        # 7. LIMPEZA E PREPARAÇÃO FINAL
        df['updated_at'] = datetime.now()

        required_columns = [
            'status', 'gerencia_da_via', 'trecho_da_via', 'sub_trecho',
            'ativo', 'atividade', 'tipo', 'data',
            'inicio_prog', 'inicio_real', 'fim_prog', 'fim_real',
            'tempo_prog', 'tempo_real',
            'local_prog', 'local_real', 'producao_prog', 'producao_real',
            'status_1', 'status_2', 'row_hash', 'updated_at' 
        ]

        for col in required_columns:
            if col not in df.columns: df[col] = None

        time_cols = ['inicio_prog', 'inicio_real', 'fim_prog', 'fim_real', 'tempo_prog', 'tempo_real']
        for col in time_cols:
            if col in df.columns:
                temp = pd.to_datetime(df[col], format='%H:%M:%S', errors='coerce').dt.time
                df[col] = temp.replace({np.nan: None})

        # 8. HASHING
        df = df.reset_index(drop=True)
        df['hash_source'] = (
            df.index.astype(str) + "-" + 
            df['data'].astype(str) + "-" + 
            df['ativo'].astype(str)
        )
        df['row_hash'] = df['hash_source'].apply(lambda x: hashlib.md5(x.encode()).hexdigest())

        return df[required_columns]

    except Exception as e:
        print(f"❌ Erro no process_dataframe: {e}")
        raise e