import pandas as pd
from sqlalchemy import create_engine
from pathlib import Path
import os
from dotenv import load_dotenv
import glob
import json
import re
import datetime

load_dotenv()

def determine_status(row):
    """Determina o status da atividade com base nas datas e overrides."""
    override_status = row.get('tempo_real_override')
    if override_status == 'DESL':
        return 'Cancelado (DESL)'
    if override_status == 'BLOCO':
        return 'Cancelado (BLOCO)'
    
    if pd.notna(row.get('end_real_dt')) and pd.notna(row.get('start_real_dt')):
        return 'Concluído'
    elif pd.notna(row.get('start_real_dt')):
        return 'Em Andamento'
    else:
        return 'Programado'

def format_timedelta_to_hhmm(td):
    """Formata um objeto Timedelta para uma string 'HH:MM'."""
    if pd.isna(td):
        return None
    total_seconds = td.total_seconds()
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    return f"{hours:02d}:{minutes:02d}"

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
        base_date = pd.to_datetime(date_str).date()
        full_dt = datetime.datetime.combine(base_date, time_dt.time())
        return pd.to_datetime(full_dt)
    except Exception:
        return None

def calculate_end_datetime(row):
    start_dt = row.get('start_real_dt')
    if pd.isna(start_dt):
        return None
    end_time_cols = ['Fim', 'Fim_8', 'Fim_10']
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
    end_dt = datetime.datetime.combine(start_dt.date(), end_time_dt_obj.time())
    if end_dt < start_dt:
        end_dt += datetime.timedelta(days=1)
    return pd.to_datetime(end_dt)

def transform_df(df):
    df = df.where(pd.notnull(df), None)
    rename_map = {'ATIVO': 'ATIVO', 'Atividade': 'Atividade', 'Inicia': 'Inicia', 'Inicio': 'Inicio', 'Duração': 'Duração', 'SB': 'SB', 'SUB': 'SUB', 'SB_4': 'SB_4', 'Quantidade': 'Quantidade', 'Quantidade_11': 'Quantidade_1', 'Fim': 'Fim', 'Fim_8': 'Fim_8', 'Fim_10': 'Fim_10', 'DATA': 'DATA', 'Prévia 1': 'Prévia - 1', 'Prévia 2': 'Prévia - 2', 'Gerência da Via': 'Gerência da Via', 'Trecho': 'Trecho', 'Programar para D+1': 'Programar para D+1', 'Coordenação da Via': 'Coordenação da Via'}
    df.rename(columns=rename_map, inplace=True)
    for col in rename_map.values():
        if col not in df.columns: df[col] = None
    df['DATA'] = pd.to_datetime(df['DATA'], errors='coerce').dt.strftime('%Y-%m-%d')
    df['start_prog_dt'] = df.apply(_create_full_datetime, args=('Inicia',), axis=1)
    df['start_real_dt'] = df.apply(_create_full_datetime, args=('Inicio',), axis=1)
    df['duration_dt'] = df.apply(lambda row: flexible_time_to_datetime(row['Duração']), axis=1)
    df['end_real_dt'] = df.apply(calculate_end_datetime, axis=1)
    df['inicio_prog'] = df['start_prog_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)
    df['inicio_real'] = df['start_real_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)
    df['tempo_prog'] = df['duration_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)
    df['tempo_real'] = (df['end_real_dt'] - df['start_real_dt']).apply(format_timedelta_to_hhmm)
    df['timer_start_timestamp'] = df['start_real_dt'].apply(lambda dt: dt.isoformat() if pd.notna(dt) else None)
    df['timer_end_timestamp'] = df['end_real_dt'].apply(lambda dt: dt.isoformat() if pd.notna(dt) else None)
    clean_local = lambda x: re.split(r'[/\\]', str(x))[0].strip() if pd.notna(x) else None
    df['local_prog'] = df['SB'].apply(clean_local)
    df['local_real'] = df['SB_4'].apply(clean_local)
    df['quantidade_prog'] = df['Quantidade']
    df['quantidade_real'] = df['Quantidade_1']
    df['detalhamento'] = df.apply(lambda row: row.get('Prévia - 2') if pd.notna(row.get('end_real_dt')) else row.get('Prévia - 1'), axis=1)
    df['tempo_real_override'] = None
    end_time_cols = ['Fim', 'Fim_8', 'Fim_10']
    df['fim_val'] = df[end_time_cols].bfill(axis=1).iloc[:, 0]
    df['fim_time_obj'] = df['fim_val'].apply(lambda x: flexible_time_to_datetime(x).time() if pd.notna(x) and flexible_time_to_datetime(x) is not None else None)
    cond_desl = df['fim_time_obj'] == datetime.time(1, 0)
    df.loc[cond_desl, 'tempo_real_override'] = 'ESP'
    df.loc[cond_desl, 'timer_start_timestamp'] = None
    df.loc[cond_desl, 'timer_end_timestamp'] = None
    cond_bloco = df['fim_time_obj'] == datetime.time(0, 1)
    df.loc[cond_bloco, 'tempo_real_override'] = 'BLOCO'
    df.loc[cond_bloco, 'timer_start_timestamp'] = None
    df.loc[cond_bloco, 'timer_end_timestamp'] = None
    df = df.drop(columns=['fim_val', 'fim_time_obj'])
    df['Status'] = df.apply(determine_status, axis=1)
    return df

def run_migration():
    print("Iniciando migração de dados do Excel para o Banco de Dados na NUVEM (Cron Job)...")
    BACKEND_ROOT = Path(__file__).resolve().parent
    map_path = str(BACKEND_ROOT / "scripts" / "mapeamento_abas.json")
    raw_data_path = str(BACKEND_ROOT / "raw_data" / "*.xlsx")
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("ERRO: DATABASE_URL não foi definida para o migrador.")
        return
    try:
        with open(map_path, 'r', encoding='utf-8') as f:
            mapa_de_abas = json.load(f)
    except Exception as e:
        print(f"ERRO: Falha ao carregar mapeamento_abas.json: {e}")
        return
    file_paths = glob.glob(raw_data_path)
    if not file_paths: 
        print("Nenhum arquivo Excel encontrado para migração.")
        return
    df_list = []
    for f_path in file_paths:
        nome_do_arquivo = os.path.basename(f_path)
        nome_da_aba = mapa_de_abas.get(nome_do_arquivo)
        if nome_da_aba:
            try:
                temp_df = pd.read_excel(f_path, sheet_name=nome_da_aba, header=None, engine='openpyxl')
                header_row = temp_df.iloc[4]
                df_data = temp_df[5:].copy()
                df_data.columns = clean_column_names(header_row)
                df_data.dropna(subset=['ATIVO'], inplace=True)
                df_list.append(df_data)
            except Exception as e:
                print(f"AVISO: Falha ao processar o arquivo '{nome_do_arquivo}'. Erro: {e}.")
                continue
    if not df_list: 
        print("Nenhum dado válido para migrar.")
        return
    df = pd.concat(df_list, ignore_index=True)
    transformed_df = transform_df(df)
    engine = create_engine(DATABASE_URL)
    print(f"Salvando {len(transformed_df)} registros na tabela 'atividades' do banco de dados Neon...")
    try:
        # Adicionadas as novas colunas à lista final
        final_columns = [
            'Status', 'Gerência da Via', 'Coordenação da Via', 'Trecho', 'SUB', 'ATIVO', 
            'Atividade', 'Programar para D+1', 'DATA', 'inicio_prog', 'inicio_real', 
            'tempo_prog', 'tempo_real', 'local_prog', 'local_real', 'quantidade_prog', 
            'quantidade_real', 'detalhamento', 'timer_start_timestamp', 
            'timer_end_timestamp', 'tempo_real_override'
        ]
        df_final = transformed_df[[col for col in final_columns if col in transformed_df.columns]].copy()
        df_final.to_sql('atividades', engine, if_exists='replace', index=False)
        print("Migração para o banco de dados na nuvem concluída com sucesso!")
    except Exception as e:
        print(f"Ocorreu um erro ao salvar no banco de dados: {e}")

if __name__ == "__main__":
    run_migration()