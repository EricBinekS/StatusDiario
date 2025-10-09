import pandas as pd
from sqlalchemy import create_engine
from pathlib import Path
import os
from dotenv import load_dotenv
import glob
import json
import re
import datetime

# Carrega as variáveis do arquivo .env (onde está a URL do seu banco de dados)
load_dotenv()

# Funções auxiliares para processar os dados do Excel
def flexible_time_to_datetime(value):
    if pd.isna(value): return None
    if isinstance(value, (int, float)):
        if value < 0: return None
        try: return pd.to_datetime('1899-12-30') + pd.to_timedelta(value, 'D')
        except: return None
    if isinstance(value, datetime.time):
        return pd.to_datetime(value.strftime('%H:%M:%S'))
    if isinstance(value, str):
        try: return pd.to_datetime(value)
        except (ValueError, TypeError): return None
    return None

def clean_column_names(columns):
    new_columns, counts = [], {}
    for col in columns:
        if pd.isna(col): col = 'Unnamed'
        clean_col = re.sub(r'[\*\.\-]', '', str(col).strip())
        clean_col = re.sub(r'\s+', ' ', clean_col)
        if clean_col in counts:
            counts[clean_col] += 1
            new_columns.append(f"{clean_col}_{counts[clean_col]}")
        else:
            counts[clean_col] = 0
            new_columns.append(clean_col)
    return new_columns

def _create_full_datetime(row, time_col_name, date_col_name='DATA'):
    date_str = row.get(date_col_name)
    time_val = row.get(time_col_name)
    if pd.isna(date_str) or pd.isna(time_val): return None
    time_dt = flexible_time_to_datetime(time_val)
    if not time_dt: return None
    try:
        full_dt = datetime.datetime.combine(pd.to_datetime(date_str).date(), time_dt.time())
        return pd.to_datetime(full_dt).tz_localize('America/Sao_Paulo')
    except Exception:
        return None

def transform_df(df):
    df = df.where(pd.notnull(df), None)
    rename_map = {'ATIVO': 'ATIVO', 'Atividade': 'Atividade', 'Inicia': 'Inicia', 'HR Turma Pronta': 'HR Turma Pronta', 'Duração': 'Duração', 'SB': 'SB', 'SUB': 'SUB', 'SB_4': 'SB_4', 'Quantidade': 'Quantidade', 'Quantidade_11': 'Quantidade_1', 'Fim': 'Fim', 'Fim_8': 'Fim_8', 'Fim_10': 'Fim_10', 'DATA': 'DATA', 'Prévia 1': 'Prévia - 1', 'Prévia 2': 'Prévia - 2', 'Gerência da Via': 'Gerência da Via', 'Trecho': 'Trecho', 'Programar para D+1': 'Programar para D+1', 'Coordenação da Via': 'Coordenação da Via'}
    df.rename(columns=rename_map, inplace=True)
    for col in rename_map.values():
        if col not in df.columns: df[col] = None
    df['DATA'] = pd.to_datetime(df['DATA'], errors='coerce').dt.strftime('%Y-%m-%d')
    df['start_prog_dt'] = df.apply(_create_full_datetime, args=('Inicia',), axis=1)
    df['start_real_dt'] = df.apply(_create_full_datetime, args=('HR Turma Pronta',), axis=1)
    df['duration_dt'] = df.apply(lambda row: flexible_time_to_datetime(row['Duração']), axis=1)
    end_time_cols = ['Fim', 'Fim_8', 'Fim_10']
    df['end_real_dt'] = df.apply(lambda row: next((_create_full_datetime(row, col) for col in end_time_cols if row.get(col)), None), axis=1)
    df['inicio_prog'] = df['start_prog_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)
    df['inicio_real'] = df['start_real_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)
    df['tempo_prog'] = df['duration_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)
    df['timer_start_timestamp'] = df['start_real_dt'].apply(lambda dt: dt.isoformat() if pd.notna(dt) else None)
    df['timer_end_timestamp'] = df['end_real_dt'].apply(lambda dt: dt.isoformat() if pd.notna(dt) else None)
    df['local_prog'] = df['SB']
    df['local_real'] = df['SB_4']
    df['quantidade_prog'] = df['Quantidade']
    df['quantidade_real'] = df['Quantidade_1']
    df['detalhamento'] = df.apply(lambda row: row.get('Prévia - 2') if pd.notna(row.get('end_real_dt')) else row.get('Prévia - 1'), axis=1)
    return df

def run_migration():
    """Lê os dados do Excel e os salva no banco de dados PostgreSQL definido no .env."""
    print("Iniciando migração de dados do Excel para o Banco de Dados na NUVEM...")

    # --- CORREÇÃO NOS CAMINHOS ---
    # A raiz do nosso projeto backend é a pasta onde este script está.
    BACKEND_ROOT = Path(__file__).resolve().parent
    map_path = str(BACKEND_ROOT / "scripts" / "mapeamento_abas.json")
    raw_data_path = str(BACKEND_ROOT / "raw_data" / "*.xlsx")
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("ERRO: DATABASE_URL não foi definida no arquivo .env")
        return

    with open(map_path, 'r', encoding='utf-8') as f:
        mapa_de_abas = json.load(f)
    
    file_paths = glob.glob(raw_data_path)
    if not file_paths: 
        print("Nenhum arquivo Excel encontrado para migração.")
        return

    df_list = []
    for f_path in file_paths:
        nome_do_arquivo = os.path.basename(f_path)
        nome_da_aba = mapa_de_abas.get(nome_do_arquivo)
        if nome_da_aba:
            temp_df = pd.read_excel(f_path, sheet_name=nome_da_aba, header=None, engine='openpyxl')
            header_row = temp_df.iloc[4]
            df_data = temp_df[5:].copy()
            df_data.columns = clean_column_names(header_row)
            df_data.dropna(subset=['ATIVO'], inplace=True)
            df_list.append(df_data)
    
    if not df_list: 
        print("Nenhum dado para migrar.")
        return
        
    df = pd.concat(df_list, ignore_index=True)
    transformed_df = transform_df(df)

    engine = create_engine(DATABASE_URL)

    print(f"Salvando {len(transformed_df)} registros na tabela 'atividades' do banco de dados Neon...")
    try:
        final_columns = [
            'Gerência da Via', 'Coordenação da Via', 'Trecho', 'SUB', 'ATIVO', 'Atividade', 
            'Programar para D+1', 'DATA', 'inicio_prog', 'inicio_real', 'tempo_prog',
            'local_prog', 'local_real', 'quantidade_prog', 'quantidade_real',
            'detalhamento', 'timer_start_timestamp', 'timer_end_timestamp'
        ]
        df_final = transformed_df[[col for col in final_columns if col in transformed_df.columns]].copy()
        df_final.to_sql('atividades', engine, if_exists='replace', index=False)
        print("Migração para o banco de dados na nuvem concluída com sucesso!")
    except Exception as e:
        print(f"Ocorreu um erro ao salvar no banco de dados: {e}")

if __name__ == "__main__":
    run_migration()