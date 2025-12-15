import pandas as pd
import numpy as np
import hashlib
from datetime import datetime, time, timedelta

def clean_text(text):
    """Limpa string: remove acentos, espaços extras e caracteres especiais."""
    if pd.isna(text) or text == "": return "coluna_vazia"
    return (str(text).strip().lower()
            .replace(' ', '_')
            .replace('-', '_') 
            .replace('ç', 'c')
            .replace('ã', 'a')
            .replace('á', 'a')
            .replace('à', 'a')
            .replace('é', 'e')
            .replace('ê', 'e')
            .replace('í', 'i')
            .replace('ó', 'o')
            .replace('ô', 'o')
            .replace('ú', 'u')
            .replace('/', '_')
            .replace('(', '')
            .replace(')', '')
            .replace('.', '')
            .replace('\n', '_'))

def clean_column_names(header_row):
    """Retorna nomes limpos e únicos para o cabeçalho."""
    if hasattr(header_row, 'tolist'):
        header_list = header_row.tolist()
    else:
        header_list = list(header_row)
    
    cleaned = [clean_text(col) for col in header_list]
    
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

def process_dataframe(df):
    try:
        # 1. FILTRAR LINHAS VAZIAS
        col_ativo = next((c for c in df.columns if 'ativo' in c), None)
        if col_ativo:
            df = df[df[col_ativo].notna()]
            df = df[df[col_ativo].astype(str).str.strip() != '']
            df.rename(columns={col_ativo: 'ativo'}, inplace=True)

        # 2. MAPEAMENTO
        rename_map = {
            'status': 'status',
            'status_operacional': 'status',
            'inicia': 'inicio_prog',
            'inicio': 'inicio_real',
            'fim': 'fim_real',
            'duracao': 'tempo_prog',
            'total': 'tempo_real',
            'sb': 'local_prog',
            'sb_4': 'local_real',
            'sub_5': 'sub_trecho',
            'coordenacao_da_via_14': 'trecho_da_via',
            'gerencia': 'gerencia_da_via',
            'quantidade': 'producao_prog',
            'quantidade_11': 'producao_real',
            'programar_para_d+1': 'tipo',
            'data_atividade': 'data'
        }
        
        actual_rename = {k: v for k, v in rename_map.items() if k in df.columns}
        df.rename(columns=actual_rename, inplace=True)

        # 3. TRATAMENTO DE STATUS (0, 1, 2)
        if 'status' in df.columns:
            def map_status(val):
                if pd.isna(val) or str(val).strip() == "": return None
                
                # Limpa a string (ex: "2.0" -> "2")
                s = str(val).strip()
                if s.endswith('.0'): s = s[:-2]
                
                # Mapeamento Direto
                if s == '2': return 2 # Concluído/Verde
                if s == '1': return 1 # Andamento/Amarelo
                if s == '0': return 0 # Cancelado/Vermelho
                
                return None # Outros valores ou vazio = Cinza
            
            df['status'] = df['status'].apply(map_status)
        else:
            df['status'] = None

        # 4. LÓGICA DE DETALHE
        col_previa_1 = next((c for c in df.columns if 'previa' in c and '1' in c), None)
        col_previa_2 = next((c for c in df.columns if 'previa' in c and '2' in c), None)

        if col_previa_2 and col_previa_1:
            df['detalhe_local'] = df[col_previa_2].fillna(df[col_previa_1])
        elif col_previa_2:
            df['detalhe_local'] = df[col_previa_2]
        elif col_previa_1:
            df['detalhe_local'] = df[col_previa_1]
        else:
            df['detalhe_local'] = None

        # 5. CÁLCULO FIM PROGRAMADO
        if 'inicio_prog' in df.columns and 'tempo_prog' in df.columns and 'fim_prog' not in df.columns:
            def calc_fim(row):
                inicio = row['inicio_prog']
                duracao = row['tempo_prog']
                if isinstance(inicio, str): 
                    try: inicio = datetime.strptime(inicio, '%H:%M:%S').time()
                    except: pass
                if isinstance(duracao, str):
                    try: duracao = datetime.strptime(duracao, '%H:%M:%S').time()
                    except: pass
                    
                if isinstance(inicio, (datetime, time)) and isinstance(duracao, (datetime, time)):
                    dummy = datetime(2000, 1, 1, inicio.hour, inicio.minute)
                    delta = timedelta(hours=duracao.hour, minutes=duracao.minute)
                    return (dummy + delta).time()
                return None
            
            df['fim_prog'] = df.apply(calc_fim, axis=1)

        # 6. REGRA MODERNIZAÇÃO
        ativos_modernizacao = [
            "ModernizaçãoTURMA2", "ModernizaçãoLASTRO2", "MOD ZYQ ZWI", "MOD ZWU ZDC",
            "MODERNIZAÇÃO TURMA 2", "MOD ZDG PAT", "MOD ZRB ZEV", "MOD ZEM",
            "MOD SPN", "MODERNIZAÇÃO ZGP", "MODERNIZAÇÃO SERRA", "MOD ZGP", "MOD FN"
        ]
        
        if 'ativo' not in df.columns: df['ativo'] = ''
        if 'gerencia_da_via' not in df.columns: df['gerencia_da_via'] = None

        df['ativo'] = df['ativo'].astype(str).str.strip().replace('nan', '')
        mask_mod = df['ativo'].isin(ativos_modernizacao)
        df.loc[mask_mod, 'gerencia_da_via'] = 'MODERNIZAÇÃO'

        # 7. LIMPEZA FINAL
        required_columns = [
            'status', 'gerencia_da_via', 'trecho_da_via', 'sub_trecho',
            'ativo', 'atividade', 'tipo', 'data',
            'inicio_prog', 'inicio_real', 'fim_prog', 'fim_real',
            'tempo_prog', 'tempo_real',
            'local_prog', 'local_real', 'producao_prog', 'producao_real',
            'detalhe_local', 'row_hash'
        ]

        for col in required_columns:
            if col not in df.columns: df[col] = None

        # Converter Tempos
        time_cols = ['inicio_prog', 'inicio_real', 'fim_prog', 'fim_real', 'tempo_prog', 'tempo_real']
        for col in time_cols:
            df[col] = pd.to_datetime(df[col], format='%H:%M:%S', errors='coerce').dt.time
            df[col] = df[col].replace({np.nan: None})

        # Hash
        df = df.reset_index(drop=True)
        def create_hash(row):
            return hashlib.md5(f"{row.name}-{row.get('data')}-{row.get('ativo')}".encode()).hexdigest()
        df['row_hash'] = df.apply(create_hash, axis=1)

        df = df[required_columns]
        df = df.where(pd.notnull(df), None)

        return df

    except Exception as e:
        print(f"❌ Erro no process_dataframe: {e}")
        raise e