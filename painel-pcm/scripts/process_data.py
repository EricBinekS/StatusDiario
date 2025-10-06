import pandas as pd
import glob
import json
import os
import re

def excel_serial_to_datetime(serial):
    """Converte o número de série de data do Excel para um objeto datetime."""
    if pd.isna(serial) or not isinstance(serial, (int, float)) or serial <= 0:
        return None
    try:
        return pd.to_datetime('1899-12-30') + pd.to_timedelta(serial, 'D')
    except:
        return None

def clean_column_names(columns):
    """Limpa e garante que os nomes de coluna sejam únicos."""
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
    """Lê arquivos Excel, processa os dados e gera um arquivo JSON."""
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
                temp_df = pd.read_excel(f_path, sheet_name=nome_da_aba, header=None)
                
                header_row = temp_df.iloc[4]
                df_data = temp_df[5:]
                
                df_data.columns = clean_column_names(header_row)

                # >>> NOVA CORREÇÃO: REMOVE LINHAS VAZIAS <<<
                # A coluna 'ATIVO' é usada como referência para remover linhas sem dados.
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
    
    rename_map = {
        'ATIVO': 'ATIVO', 'Atividade': 'Atividade', 'Inicia': 'Inicia', 
        'HR Turma Pronta': 'HR Turma Pronta', 'Duração': 'Duração', 'SB': 'SB', 
        'SB_4': 'SB_4', 'Quantidade': 'Quantidade', 'Quantidade_11': 'Quantidade_1', 
        'Fim': 'Fim', 'Fim_8': 'Fim_8', 'Fim_10': 'Fim_10', 'Fim_11_1': 'Fim_11',
        'Prévia 1': 'Prévia - 1',
        'Prévia 2': 'Prévia - 2',
        'DATA': 'DATA', 
        'Gerência da Via': 'Gerência da Via', 'Trecho': 'Trecho', 
        'Programar para D+1': 'Programar para D+1'
    }
    df.rename(columns=rename_map, inplace=True)

    required_cols = list(rename_map.values())
    for col in required_cols:
        if col not in df.columns:
            print(f"AVISO: A coluna padrão '{col}' não foi encontrada e será criada vazia.")
            df[col] = None
    
    if 'DATA' in df.columns:
        df['DATA'] = pd.to_datetime(df['DATA'], errors='coerce').dt.strftime('%Y-%m-%d')

    def safe_format_time(serial):
        dt = excel_serial_to_datetime(serial)
        return dt.strftime('%H:%M') if dt else ""

    df['display_identificador'] = df.apply(lambda r: f"<strong>{r.get('ATIVO') or ''}</strong><br/>{r.get('Atividade') or ''}", axis=1)
    df['display_inicio'] = df.apply(lambda r: f"{safe_format_time(r.get('Inicia'))}<br/>{safe_format_time(r.get('HR Turma Pronta'))}", axis=1)
    df['display_tempo_prog'] = df['Duração'].apply(safe_format_time)
    df['display_local'] = df.apply(lambda r: f"{r.get('SB') or ''}<br/>{r.get('SB_4') or ''}", axis=1)
    df['display_quantidade'] = df.apply(lambda r: f"{r.get('Quantidade') or 0}<br/>{r.get('Quantidade_1') or 0}", axis=1)

    def get_detalhamento(row):
        has_end_time = any(row.get(col) and pd.to_numeric(row.get(col), errors='coerce') > 0 for col in ['Fim', 'Fim_8', 'Fim_10', 'Fim_11'])
        return row.get('Prévia - 2') if has_end_time else row.get('Prévia - 1')
    df['display_detalhamento'] = df.apply(get_detalhamento, axis=1)

    df['timer_start_timestamp'] = df['HR Turma Pronta'].apply(lambda s: excel_serial_to_datetime(s).isoformat() if s and pd.to_numeric(s, errors='coerce') > 0 else None)
    
    def get_end_timestamp(row):
        end_time_serial = next((row[col] for col in ['Fim', 'Fim_8', 'Fim_10', 'Fim_11'] if row.get(col) and pd.to_numeric(row.get(col), errors='coerce') > 0), None)
        return excel_serial_to_datetime(end_time_serial).isoformat() if end_time_serial else None
    df['timer_end_timestamp'] = df.apply(get_end_timestamp, axis=1)
    
    final_columns = [
        'Gerência da Via', 'Trecho', 'ATIVO', 'Atividade', 'Programar para D+1', 'DATA',
        'display_identificador', 'display_inicio', 'display_tempo_prog', 'display_local', 'display_quantidade', 'display_detalhamento',
        'timer_start_timestamp', 'timer_end_timestamp'
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