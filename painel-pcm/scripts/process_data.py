import pandas as pd
import glob
import json
import os

def excel_serial_to_datetime(serial):
    if pd.isna(serial) or not isinstance(serial, (int, float)) or serial <= 0:
        return None
    return pd.to_datetime('1899-12-30') + pd.to_timedelta(serial, 'D')

def process_files():
    print("Iniciando processamento dos arquivos Excel...")
    
    file_paths = glob.glob("raw_data/*.xlsx")
    if not file_paths:
        print("Nenhum arquivo Excel encontrado na pasta 'dados_brutos'.")
        return

    try:
        df = pd.concat((pd.read_excel(f) for f in file_paths), ignore_index=True)
        print(f"{len(df)} linhas de dados carregadas.")
    except Exception as e:
        print(f"Erro ao ler os arquivos Excel: {e}")
        return

    required_cols = ['ATIVO', 'Atividade', 'Inicia', 'HR Turma Pronta', 'Duração', 'SB', 'SB_4', 'Quantidade', 'Quantidade_1', 'Fim', 'Fim_8', 'Fim_10', 'Fim_11', 'Prévia - 1', 'Prévia - 2', 'DATA', 'Gerência da Via', 'Trecho', 'Programar para D+1']
    for col in required_cols:
        if col not in df.columns:
            df[col] = None
    
    numeric_cols = ['Inicia', 'HR Turma Pronta', 'Duração', 'Fim', 'Fim_8', 'Fim_10', 'Fim_11']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')


    df['display_identificador'] = df.apply(lambda r: f"<strong>{r['ATIVO'] or ''}</strong><br/>{r['Atividade'] or ''}", axis=1)
    df['display_inicio'] = df.apply(lambda r: f"{(excel_serial_to_datetime(r['Inicia']).strftime('%H:%M') if pd.notna(r['Inicia']) else '')}<br/>{(excel_serial_to_datetime(r['HR Turma Pronta']).strftime('%H:%M') if pd.notna(r['HR Turma Pronta']) else '')}", axis=1)
    df['display_tempo_prog'] = df['Duração'].apply(lambda s: excel_serial_to_datetime(s).strftime('%H:%M') if pd.notna(s) else '')
    df['display_local'] = df.apply(lambda r: f"{r['SB'] or ''}<br/>{r['SB_4'] or ''}", axis=1)
    df['display_quantidade'] = df.apply(lambda r: f"{r.get('Quantidade', 0) or 0}<br/>{r.get('Quantidade_1', 0) or 0}", axis=1)

    def get_detalhamento(row):
        has_end_time = any(pd.notna(row[col]) and row[col] > 0 for col in ['Fim', 'Fim_8', 'Fim_10', 'Fim_11'])
        return row['Prévia - 2'] if has_end_time else row['Prévia - 1']
    df['display_detalhamento'] = df.apply(get_detalhamento, axis=1)

    df['timer_start_timestamp'] = df['HR Turma Pronta'].apply(lambda s: excel_serial_to_datetime(s).isoformat() if pd.notna(s) and s > 0 else None)
    
    def get_end_timestamp(row):
        end_time_serial = next((row[col] for col in ['Fim', 'Fim_8', 'Fim_10', 'Fim_11'] if pd.notna(row[col]) and row[col] > 0), None)
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
        
    print("Arquivo 'public/data.json' gerado com sucesso com dados pré-formatados.")

if __name__ == "__main__":
    process_files()