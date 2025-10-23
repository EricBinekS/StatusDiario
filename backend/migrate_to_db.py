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
def calculate_operational_status(row):
    """Determina o status operacional (calculado) da atividade."""
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
    if not isinstance(td, pd.Timedelta):
        try:
            td = pd.to_timedelta(td, unit='s' if isinstance(td, (int, float)) else None)
        except (ValueError, TypeError):
            return None
        if pd.isna(td):
             return None

    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
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
        clean_col = re.sub(r'[^\w\s]+', '', str(col).strip().lower())
        clean_col = re.sub(r'\s+', '_', clean_col)
        if clean_col in counts:
            counts[clean_col] += 1
            new_columns.append(f"{clean_col}_{counts[clean_col]}")
        else:
            counts[clean_col] = 0
            new_columns.append(clean_col)
    return new_columns

def _create_full_datetime(row, time_col_name, date_col_name='data'):
    date_obj = row.get(date_col_name)
    time_val = row.get(time_col_name)
    if pd.isna(date_obj) or pd.isna(time_val): return None
    time_dt = flexible_time_to_datetime(time_val)
    if not time_dt: return None
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
    # Usa start_dt.date() que já é um objeto date
    end_dt_naive = datetime.datetime.combine(start_dt.date(), end_time_dt_obj.time())
    # Converte start_dt para naive para comparação segura
    start_dt_naive = start_dt.replace(tzinfo=None) if start_dt.tzinfo else start_dt

    if end_dt_naive < start_dt_naive:
        end_dt_naive += datetime.timedelta(days=1)
    return pd.to_datetime(end_dt_naive)
 
def transform_df(df):
    df.columns = clean_column_names(df.columns)
    required_cols = ['data', 'ativo']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
         print(f"AVISO: Colunas essenciais {missing_cols} não encontradas. Pulando DataFrame.")
         return pd.DataFrame()

    df = df.where(pd.notnull(df), None)
    df['data'] = pd.to_datetime(df['data'], errors='coerce')
    df.dropna(subset=['data'], inplace=True)

    df['start_prog_dt'] = df.apply(_create_full_datetime, args=('inicia',), axis=1)
    df['start_real_dt'] = df.apply(_create_full_datetime, args=('inicio',), axis=1)
    df['duration_dt'] = df.apply(lambda row: flexible_time_to_datetime(row.get('duração')), axis=1)
    df['end_real_dt'] = df.apply(calculate_end_datetime, axis=1)
    df['inicio_prog'] = df['start_prog_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)
    df['inicio_real'] = df['start_real_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)
    df['tempo_prog'] = df['duration_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)

    mask = df['start_real_dt'].notna() & df['end_real_dt'].notna()
    # Calcula a diferença apenas onde ambos existem
    df.loc[mask, 'tempo_real_td'] = df.loc[mask, 'end_real_dt'] - df.loc[mask, 'start_real_dt']
    # Formata a diferença onde ela foi calculada
    df['tempo_real'] = df.get('tempo_real_td', pd.Series(index=df.index)).apply(format_timedelta_to_hhmm)
    df.drop(columns=['tempo_real_td'], inplace=True, errors='ignore') # Remove coluna temporária

    df['timer_start_timestamp'] = df['start_real_dt'].apply(lambda dt: dt.isoformat() if pd.notna(dt) else None)
    df['timer_end_timestamp'] = df['end_real_dt'].apply(lambda dt: dt.isoformat() if pd.notna(dt) else None)

    clean_local = lambda x: re.split(r'[/\\]', str(x))[0].strip() if pd.notna(x) else None
    df['local_prog'] = df.get('sb', pd.Series(index=df.index)).apply(clean_local)
    df['local_real'] = df.get('sb_4', pd.Series(index=df.index)).apply(clean_local)
    df['quantidade_prog'] = df.get('quantidade')
    df['quantidade_real'] = df.get('quantidade_11') # Verifica se é quantidade_11 ou quantidade_1

    df['detalhamento'] = df.apply(lambda row: row.get('prévia_2') if pd.notna(row.get('end_real_dt')) else row.get('prévia_1'), axis=1)
    df['tempo_real_override'] = None
    end_time_cols = ['fim', 'fim_8', 'fim_10']
    valid_end_cols = [col for col in end_time_cols if col in df.columns]
    if valid_end_cols:
        df['fim_val'] = df[valid_end_cols].bfill(axis=1).iloc[:, 0]
        df['fim_time_obj'] = df['fim_val'].apply(lambda x: flexible_time_to_datetime(x).time() if pd.notna(x) and flexible_time_to_datetime(x) is not None else None)

        cond_desl = df['fim_time_obj'] == datetime.time(1, 0)
        df.loc[cond_desl, 'tempo_real_override'] = 'DESL'
        df.loc[cond_desl, 'timer_start_timestamp'] = None
        df.loc[cond_desl, 'timer_end_timestamp'] = None
        df.loc[cond_desl, 'tempo_real'] = None # Zera o tempo calculado

        cond_bloco = df['fim_time_obj'] == datetime.time(0, 1)
        df.loc[cond_bloco, 'tempo_real_override'] = 'BLOCO'
        df.loc[cond_bloco, 'timer_start_timestamp'] = None
        df.loc[cond_bloco, 'timer_end_timestamp'] = None
        df.loc[cond_bloco, 'tempo_real'] = None # Zera o tempo calculado

        df = df.drop(columns=['fim_val', 'fim_time_obj'], errors='ignore')

    df['operational_status'] = df.apply(calculate_operational_status, axis=1)

    if 'status' not in df.columns:
        df['status'] = 'N/A'
    df['data'] = df['data'].dt.strftime('%Y-%m-%d')
    return df

def run_migration():
    print("Iniciando migração de dados do Excel para o Banco de Dados na NUVEM (Cron Job)...")
    BACKEND_ROOT = Path(__file__).resolve().parent
    map_path = str(BACKEND_ROOT / "scripts" / "mapeamento_abas.json")
    raw_data_path = str(BACKEND_ROOT / "raw_data" / "*.xlsx")
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("ERRO: DATABASE_URL não foi definida.")
        return
    try:
        with open(map_path, 'r', encoding='utf-8') as f:
            mapa_de_abas = json.load(f)
    except Exception as e:
        print(f"ERRO: Falha ao carregar mapeamento_abas.json: {e}")
        return
    file_paths = glob.glob(raw_data_path)
    if not file_paths:
        print("Nenhum arquivo Excel encontrado.")
        return

    df_list = []
    all_processed_columns = set()
    for f_path in file_paths:
        nome_do_arquivo = os.path.basename(f_path)
        nome_da_aba = mapa_de_abas.get(nome_do_arquivo)
        if nome_da_aba:
            try:
                temp_df = pd.read_excel(f_path, sheet_name=nome_da_aba, header=None, engine='openpyxl')
                header_row_index = 4
                data_start_row_index = 5

                header_row = temp_df.iloc[header_row_index]
                df_data = temp_df[data_start_row_index:].copy()

                cleaned_cols = clean_column_names(header_row)
                df_data.columns = cleaned_cols

                if 'ativo' not in df_data.columns:
                    print(f"AVISO: Coluna 'ativo' não encontrada em '{nome_do_arquivo}' após limpeza. Colunas encontradas: {cleaned_cols}")
                    continue

                df_data.dropna(subset=['ativo'], inplace=True)
                df_list.append(df_data)
                all_processed_columns.update(df_data.columns)

            except Exception as e:
                print(f"AVISO: Falha ao processar '{nome_do_arquivo}'. Erro: {e}.")
                continue
    if not df_list:
        print("Nenhum dado válido para migrar.")
        return

    df_processed_list = []
    for df_item in df_list:
         missing = list(all_processed_columns - set(df_item.columns))
         if missing:
              df_item = df_item.reindex(columns=sorted(list(all_processed_columns)), fill_value=None)
         df_processed_list.append(df_item)

    if not df_processed_list:
         print("Nenhum DataFrame processado para concatenar.")
         return

    df = pd.concat(df_processed_list, ignore_index=True)
    transformed_df = transform_df(df)

    if transformed_df.empty:
         print("ERRO: Transformação resultou em DataFrame vazio.")
         return

    hoje = datetime.date.today()
    data_limite = hoje - datetime.timedelta(days=10)
    transformed_df['data_dt_temp'] = pd.to_datetime(transformed_df['data'], errors='coerce')
    registros_antes = len(transformed_df)
    df_filtrado = transformed_df.dropna(subset=['data_dt_temp'])
    df_filtrado = df_filtrado[df_filtrado['data_dt_temp'].dt.date >= data_limite].copy()
    df_filtrado.drop(columns=['data_dt_temp'], inplace=True)
    registros_depois = len(df_filtrado)

    print(f"Filtrando para últimos 10 dias ({data_limite} a {hoje}).")
    print(f"Registros antes: {registros_antes}, após: {registros_depois}.")

    engine = create_engine(DATABASE_URL)
    print(f"Salvando {len(df_filtrado)} registros na tabela 'atividades'...")
    try:
        final_columns = [
            'status', 'operational_status', 'gerência_da_via', 'coordenação_da_via', 'trecho', 'sub', 'ativo',
            'atividade', 'programar_para_d_1', 'data', 'inicio_prog', 'inicio_real',
            'tempo_prog', 'tempo_real',
            'local_prog', 'local_real', 'quantidade_prog',
            'quantidade_real', 'detalhamento', 'timer_start_timestamp',
            'timer_end_timestamp', 'tempo_real_override'
        ]
        cols_to_select = [col for col in final_columns if col in df_filtrado.columns]
        df_final = df_filtrado[cols_to_select].copy()

        df_final.to_sql('atividades', engine, if_exists='replace', index=False)
        print("Migração concluída com sucesso!")
    except Exception as e:
        print(f"Erro ao salvar no banco de dados: {e}")

if __name__ == "__main__":
    run_migration()

