import pandas as pd
import numpy as np
import hashlib
import re
from datetime import datetime, timedelta

def clean_column_names(header_row):
    """Retorna nomes limpos e únicos para o cabeçalho."""
    if hasattr(header_row, 'tolist'):
        header_list = header_row.tolist()
    else:
        header_list = list(header_row)
    
    def _clean(text):
        if pd.isna(text) or text == "": return "coluna_vazia"
        # Limpeza agressiva:
        # 1. Lowercase e strip
        # 2. Substitui espaços e hifens por underline
        # 3. Remove acentos
        return (str(text).strip().lower()
                .replace(' ', '_').replace('-', '_')
                .replace('ç', 'c').replace('ã', 'a').replace('á', 'a')
                .replace('à', 'a').replace('é', 'e').replace('ê', 'e')
                .replace('í', 'i').replace('ó', 'o').replace('ô', 'o')
                .replace('ú', 'u').replace('/', '_').replace('.', '')
                .replace('(', '').replace(')', '').replace('\n', '_'))

    cleaned = [_clean(col) for col in header_list]
    
    # Garante unicidade (ex: previa, previa_1)
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
    # 1. Busca exata (prioridade)
    for col in candidates:
        if col in df.columns:
            return col
    
    # 2. Busca aproximada (contém)
    for col in df.columns:
        for cand in candidates:
            # O len(col) < len(cand) + 4 permite variações como previa___1 (3 underscores)
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
        
        # 2. MAPEAMENTO DE COLUNAS (Ajustado para Prévia - 1 e Prévia - 2)
        # Nota: "Prévia - 1" vira "previa___1" após a limpeza (espaço + hífen + espaço = 3 underlines)
        col_mappings = {
            'status': ['status', 'status_operacional', 'farol'],
            
            # ADICIONADO: previa___1 e previa___2 para capturar "Prévia - 1" e "Prévia - 2"
            'status_1': ['status_1', 'previa___1', 'previa_1', 'previa', 'comentario_1'],
            'status_2': ['status_2', 'previa___2', 'previa_2', 'comentario_2', 'observacao_2'],
            
            'inicio_prog': ['inicia', 'inicio_prog', 'inicio_previsto'],
            'inicio_real': ['inicio', 'inicio_real'],
            'fim_real': ['fim', 'fim_real', 'termino'],
            'tempo_prog': ['duracao', 'tempo_prog', 'janela'],
            'tempo_real': ['total', 'tempo_real', 'tempo_gasto'],
            'local_prog': ['sb', 'local_prog'],
            'local_real': ['sb_4', 'local_real'],
            'sub_trecho': ['sub_5', 'sub_trecho'],
            'trecho_da_via': ['coordenacao_da_via_14', 'trecho_da_via', 'trecho'],
            'gerencia_da_via': ['gerencia', 'gerencia_da_via'],
            'producao_prog': ['quantidade', 'producao_prog'],
            'producao_real': ['quantidade_11', 'producao_real'],
            'tipo': ['programar_para_d+1', 'tipo', 'classificacao'],
            'data': ['data_atividade', 'data']
        }

        # Aplica renomeação
        rename_dict = {}
        for target, candidates in col_mappings.items():
            found = find_column(df, candidates)
            if found:
                rename_dict[found] = target
        
        df.rename(columns=rename_dict, inplace=True)

        # 3. FILTROS DE NEGÓCIO
        ATIVIDADES_IGNORADAS = ["MECANIZAÇÃO - ESMERILHADORA", "DESLOCAMENTO", "DETECÇÃO - RONDA 7 DIAS"]
        GERENCIAS_IGNORADAS = ["MALHA CENTRAL"]

        if 'atividade' in df.columns:
            pattern = '|'.join([re.escape(x) for x in ATIVIDADES_IGNORADAS])
            df = df[~df['atividade'].astype(str).str.contains(pattern, case=False, na=False)]

        if 'gerencia_da_via' in df.columns:
            pattern_ger = '|'.join([re.escape(x) for x in GERENCIAS_IGNORADAS])
            df = df[~df['gerencia_da_via'].astype(str).str.contains(pattern_ger, case=False, na=False)]

        # 4. TRATAMENTO DE STATUS
        if 'status' in df.columns:
            df['status'] = pd.to_numeric(df['status'], errors='coerce')
            df.loc[~df['status'].isin([0, 1, 2]), 'status'] = np.nan
        else:
            df['status'] = np.nan

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
        ativos_modernizacao = [
            "ModernizaçãoTURMA2", "ModernizaçãoLASTRO2", "MOD ZYQ ZWI", "MOD ZWU ZDC",
            "MODERNIZAÇÃO TURMA 2", "MOD ZDG PAT", "MOD ZRB ZEV", "MOD ZEM",
            "MOD SPN", "MODERNIZAÇÃO ZGP", "MODERNIZAÇÃO SERRA", "MOD ZGP", "MOD FN", "MOD SPN",
        ]
        
        if 'ativo' not in df.columns: df['ativo'] = ''
        if 'gerencia_da_via' not in df.columns: df['gerencia_da_via'] = None

        mask_mod = df['ativo'].astype(str).str.strip().isin(ativos_modernizacao)
        df.loc[mask_mod, 'gerencia_da_via'] = 'MODERNIZAÇÃO'

        # 6.1 REGRA MODERNIZAÇÃO POR ATIVIDADE
        atividades_modernizacao = [
            "MODERNIZAÇÃO - PEDRA - DESCARGA",
            "MODERNIZAÇÃO - OUTRA ATIVIDADE",
            "MODERNIZAÇÃO - SOLDA",
            "MODERNIZAÇÃO - RECOLHIMENTO DE DORMENTE",
            "MODERNIZAÇÃO - TRILHO - DESCARGA",
            "MODERNIZAÇÃO - SOCADORA",
            "MODERNIZAÇÃO - DORMENTE - DESCARGA",
            "MODERNIZAÇÃO - SUBSTITUIÇÃO DE DORMENTE",
            "MODERNIZAÇÃO - PEDRA - CARGA",
            "MODERNIZAÇÃO - DESCARGA - TRILHO"
        ]

        if 'atividade' not in df.columns:
            df['atividade'] = ''

        mask_mod_atividade = df['atividade'].astype(str).str.strip().isin(atividades_modernizacao)
        df.loc[mask_mod_atividade, 'gerencia_da_via'] = 'MODERNIZAÇÃO'


        # 7. LIMPEZA FINAL
        # REMOVIDO: detalhe_local
        required_columns = [
            'status', 'gerencia_da_via', 'trecho_da_via', 'sub_trecho',
            'ativo', 'atividade', 'tipo', 'data',
            'inicio_prog', 'inicio_real', 'fim_prog', 'fim_real',
            'tempo_prog', 'tempo_real',
            'local_prog', 'local_real', 'producao_prog', 'producao_real',
            'status_1', 'status_2', 'row_hash'
        ]

        # Garante criação de colunas ausentes como None
        for col in required_columns:
            if col not in df.columns: df[col] = None

        # Padroniza tempos
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