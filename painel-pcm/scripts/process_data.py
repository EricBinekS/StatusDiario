import pandas as pd
import glob
import json
import os
import re
import datetime # Importa o módulo datetime

def flexible_time_to_datetime(value):
    """
    Função flexível que converte múltiplos formatos de hora (serial do Excel,
    objeto time, ou string 'HH:MM:SS') para um objeto datetime completo.
    """
    if pd.isna(value):
        return None

    # Caso 1: É um número (serial do Excel)
    if isinstance(value, (int, float)):
        if value <= 0 and value > -1: # Permite durações como 00:00 mas ignora negativos
             try: # Trata 00:00:00 como um tempo válido
                return pd.to_datetime('1899-12-30') + pd.to_timedelta(value, 'D')
             except:
                return None
        if value <= 0: return None # Rejeita outros valores não positivos
        try:
            return pd.to_datetime('1899-12-30') + pd.to_timedelta(value, 'D')
        except:
            return None

    # Caso 2: É um objeto datetime.time
    if isinstance(value, datetime.time):
        return pd.to_datetime(value.strftime('%H:%M:%S'))

    # Caso 3: É uma string de hora
    if isinstance(value, str):
        try:
            return pd.to_datetime(value)
        except (ValueError, TypeError):
            return None
            
    return None

def clean_column_names(columns):
    new_columns = []
    counts = {}
    for col in columns:
        if pd.isna(col):
            col = 'Unnamed'
        
        clean_col = str(col).strip()
        clean_col = re.sub(r'[\*\.\-]', '', clean_col)
        clean_col = re.sub(r'\s+', ' ', clean_col)
        
        if clean_col in counts:
            counts[clean_col] += 1
            new_columns.append(f"{clean_col}_{counts[clean_col]}")
        else:
            counts[clean_col] = 0
            new_columns.append(clean_col)
    return new_columns

def process_files():
    print("Iniciando processamento dos arquivos Excel...")
    
    file_paths = glob.glob("raw_data/*.xlsx")
    if not file_paths:
        print("AVISO: Nenhum arquivo Excel encontrado.")
        return

    try:
        with open('scripts/mapeamento_abas.json', 'r', encoding='utf-8') as f:
            mapa_de_abas = json.load(f)
        print("Arquivo de mapeamento de abas carregado com sucesso.")

        df_list = []
        for f_path in file_paths:
            nome_do_arquivo = os.path.basename(f_path)
            nome_da_aba = mapa_de_abas.get(nome_do_arquivo)
            
            if nome_da_aba:
                print(f"Lendo arquivo '{nome_do_arquivo}' na aba '{nome_da_aba}'...")
                temp_df = pd.read_excel(f_path, sheet_name=nome_da_aba, header=None, engine='openpyxl')
                
                header_row = temp_df.iloc[4]
                df_data = temp_df[5:].copy()
                
                df_data.columns = clean_column_names(header_row)

                print(f"--- Colunas encontradas em '{nome_do_arquivo}': {list(df_data.columns)}")
                
                df_data.dropna(subset=['ATIVO'], inplace=True)
                df_list.append(df_data)
            else:
                print(f"AVISO: Mapeamento não encontrado para '{nome_do_arquivo}'.")
        
        if not df_list:
            print("Nenhum dado foi carregado.")
            return

        df = pd.concat(df_list, ignore_index=True)
        print(f"{len(df)} linhas de dados carregadas.")

    except Exception as e:
        print(f"ERRO CRÍTICO ao ler ou processar os arquivos Excel: {e}")
        return

    df = df.where(pd.notnull(df), None)
    
    # Mapeamento ajustado sem Fim_11
    rename_map = {
        'ATIVO': 'ATIVO', 'Atividade': 'Atividade', 'Inicia': 'Inicia', 
        'HR Turma Pronta': 'HR Turma Pronta', 'Duração': 'Duração', 'SB': 'SB', 
        'SB_4': 'SB_4', 'Quantidade': 'Quantidade', 'Quantidade_11': 'Quantidade_1', 
        'Fim': 'Fim', 'Fim_8': 'Fim_8', 'Fim_10': 'Fim_10',
        'Prévia 1': 'Prévia - 1', 'Prévia 2': 'Prévia - 2', 'DATA': 'DATA', 
        'Gerência da Via': 'Gerência da Via', 'Trecho': 'Trecho', 
        'Programar para D+1': 'Programar para D+1'
    }
    df.rename(columns=rename_map, inplace=True)

    required_cols = list(rename_map.values())
    for col in required_cols:
        if col not in df.columns:
            # Não vamos mais avisar sobre Fim_11, pois foi removido
            if col != 'Fim_11':
                print(f"AVISO: A coluna padrão '{col}' não foi encontrada e será criada vazia.")
            df[col] = None
    
    if 'DATA' in df.columns:
        df['DATA'] = pd.to_datetime(df['DATA'], errors='coerce').dt.strftime('%Y-%m-%d')

    # Funções auxiliares agora usam a nova função flexível
    def safe_format_time(value):
        dt = flexible_time_to_datetime(value)
        return dt.strftime('%H:%M') if dt else None
    
    def value_to_iso(value):
        dt = flexible_time_to_datetime(value)
        return dt.isoformat() if dt else None

    df['inicio_prog'] = df['Inicia'].apply(safe_format_time)
    df['inicio_real'] = df['HR Turma Pronta'].apply(safe_format_time)
    df['tempo_prog'] = df['Duração'].apply(safe_format_time)
    
    df['local_prog'] = df['SB']
    df['local_real'] = df['SB_4']
    df['quantidade_prog'] = df['Quantidade']
    df['quantidade_real'] = df['Quantidade_1']

    def get_detalhamento(row):
        # Lógica de Fim ajustada para remover Fim_11
        has_end_time = any(row.get(col) for col in ['Fim', 'Fim_8', 'Fim_10'])
        return row.get('Prévia - 2') if has_end_time else row.get('Prévia - 1')
    df['detalhamento'] = df.apply(get_detalhamento, axis=1)

    df['timer_start_timestamp'] = df['HR Turma Pronta'].apply(value_to_iso)
    
    def get_end_timestamp(row):
        # Lógica de Fim ajustada para remover Fim_11
        end_time_value = next((row[col] for col in ['Fim', 'Fim_8', 'Fim_10'] if row.get(col)), None)
        return value_to_iso(end_time_value)
    df['timer_end_timestamp'] = df.apply(get_end_timestamp, axis=1)
    
    final_columns = [
        'Gerência da Via', 'Trecho', 'ATIVO', 'Atividade', 'Programar para D+1', 'DATA',
        'inicio_prog', 'inicio_real', 'tempo_prog',
        'local_prog', 'local_real', 'quantidade_prog', 'quantidade_real',
        'detalhamento', 'timer_start_timestamp', 'timer_end_timestamp'
    ]

    df_final = df[[col for col in final_columns if col in df.columns]].copy()
    df_final = df_final.where(pd.notnull(df_final), None)
    result_list = df_final.to_dict(orient='records')
    
    os.makedirs('public', exist_ok=True)
    with open('public/data.json', 'w', encoding='utf-8') as f:
        json.dump(result_list, f, ensure_ascii=False, indent=2)
        
    print("Arquivo 'public/data.json' gerado com sucesso.")

if __name__ == "__main__":
    process_files()