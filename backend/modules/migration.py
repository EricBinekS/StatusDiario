import pandas as pd
from sqlalchemy import text
from pathlib import Path
import os
import glob
import json
import datetime
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)      
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from db.database import get_db_engine
from scripts.utils import clean_column_names, normalize_str
from modules.data_processor import transform_dataframe, make_row_id

# Mapeamentos para coluna final do DB (com acentos)
COL_MAPPING = {
    'gerencia_da_via': 'gerência_da_via',
    'coordenacao_da_via': 'coordenação_da_via',
}

# Colunas finais esperadas no banco de dados
FINAL_COLUMNS_DB = [
    'row_hash', 'status', 'operational_status', 'gerência_da_via', 'coordenação_da_via', 'trecho', 'sub', 'ativo',
    'atividade', 'tipo', 'data', 'inicio_prog', 'inicio_real', 'tempo_prog', 'tempo_real',
    'local_prog', 'local_real', 'quantidade_prog', 'quantidade_real', 'detalhamento', 'timer_start_timestamp',
    'timer_end_timestamp', 'tempo_real_override'
]


def _load_raw_data():
    """Carrega todos os arquivos .xlsx e concatena em um único DataFrame."""
    # Garante que o caminho seja relativo à raiz do backend calculada
    map_path = os.path.join(backend_dir, "scripts", "mapeamento_abas.json")
    raw_data_path = os.path.join(backend_dir, "raw_data", "*.xlsx")

    try:
        with open(map_path, 'r', encoding='utf-8') as f:
            mapa_de_abas = json.load(f)
    except Exception as e:
        print(f"🔴 ERRO: Ao ler o mapa de abas em {map_path}: {e}")
        return None

    file_paths = glob.glob(raw_data_path)
    if not file_paths:
        print(f"🟠 AVISO: Nenhum arquivo de dados encontrado em {raw_data_path}.")
        return None

    df_list = []
    all_processed_columns = set()

    for f_path in file_paths:
        nome_do_arquivo = os.path.basename(f_path)
        nome_da_aba = mapa_de_abas.get(nome_do_arquivo)
        print(f"\n⚙️ Processando arquivo: {nome_do_arquivo} (Aba: {nome_da_aba})")
        sys.stdout.flush()

        if nome_da_aba:
            try:
                # Leitura da planilha, assumindo cabeçalho na linha 5 (index 4)
                temp_df = pd.read_excel(f_path, sheet_name=nome_da_aba, header=None, engine='openpyxl')
                header_row_index = 4
                data_start_row_index = 5
                
                header_row = temp_df.iloc[header_row_index]
                df_data = temp_df[data_start_row_index:].copy()
                cleaned_cols = clean_column_names(header_row)
                df_data.columns = cleaned_cols
                
                if 'ativo' not in df_data.columns:
                    print("  -> Coluna 'ativo' não encontrada. Descartando arquivo.")
                    continue

                df_data.dropna(subset=['ativo'], inplace=True)
                df_list.append(df_data)
                all_processed_columns.update(df_data.columns)
            except Exception as e:
                print(f"  -> 🔴 ERRO ao processar: {e}")
                continue
        else:
            print("  -> Não há mapeamento para este arquivo. Ignorando.")

    if not df_list:
        print("\n🟠 AVISO: Nenhum DataFrame foi processado com sucesso.")
        return None

    print("\n📦 Unificando e Padronizando DataFrames...")
    # Garante que todos os DFs tenham o mesmo conjunto de colunas antes de concatenar
    df_processed_list = []
    for df_item in df_list:
        missing = list(all_processed_columns - set(df_item.columns))
        if missing:
            df_item = df_item.reindex(columns=sorted(list(all_processed_columns)), fill_value=None)
        df_processed_list.append(df_item)
        
    df = pd.concat(df_processed_list, ignore_index=True)
    
    # Renomeação de colunas específicas (para evitar conflito antes da limpeza)
    if 'programar_para_d1' in df.columns and 'programar_para_d_1' not in df.columns:
        df.rename(columns={'programar_para_d1': 'programar_para_d_1'}, inplace=True)
    if 'programar_para_d_1' in df.columns:
        df.rename(columns={'programar_para_d_1': 'tipo'}, inplace=True)

    # Tratamento de 'gerencia_da_via13' (lógica do mapeamento do DF)
    if 'gerencia_da_via13' in df.columns:
        if 'gerencia_da_via' in df.columns:
            df.drop(columns=['gerencia_da_via'], inplace=True, errors='ignore')
        df.rename(columns={'gerencia_da_via13': 'gerencia_da_via'}, inplace=True)
    
    return df


def _clean_and_finalize_data(df):
    """Aplica transformações e normalizações finais."""
    
    # 1. Transformação de Colunas
    transformed_df = transform_dataframe(df.copy())
    if transformed_df.empty:
        return pd.DataFrame()

    # 2. Filtro de Data Limite (últimos 31 dias)
    hoje = datetime.date.today()
    data_limite = hoje - datetime.timedelta(days=31)

    transformed_df['data_dt_temp'] = pd.to_datetime(transformed_df['data'], errors='coerce')
    df_filtrado = transformed_df.dropna(subset=['data_dt_temp'])
    df_filtrado = df_filtrado[df_filtrado['data_dt_temp'].dt.date >= data_limite].copy()
    df_filtrado.drop(columns=['data_dt_temp'], inplace=True, errors='ignore')

    # 3. Normalização
    cols_to_normalize = ['ativo', 'atividade', 'tipo', 'gerencia_da_via']
    for col in cols_to_normalize:
        if col in df_filtrado.columns:
            df_filtrado[col] = df_filtrado[col].apply(normalize_str)
    
    # 4. Remoção de Duplicatas
    dup_subset = ['ativo', 'atividade', 'data', 'inicio_real', 'gerencia_da_via'] 
    if all(col in df_filtrado.columns for col in dup_subset):
        df_filtrado = df_filtrado.drop_duplicates(subset=dup_subset, keep='first')

    # 5. Geração de Hash
    df_filtrado['row_hash'] = df_filtrado.apply(make_row_id, axis=1)
    
    # 6. Mapeamento de Colunas (Limpo -> DB) e Seleção Final
    df_final = df_filtrado.copy()
    
    for clean_name, db_name in COL_MAPPING.items():
        if clean_name in df_final.columns:
            df_final.rename(columns={clean_name: db_name}, inplace=True)
            
    for col in FINAL_COLUMNS_DB:
        if col not in df_final.columns:
            df_final[col] = None

    df_final = df_final[FINAL_COLUMNS_DB].copy()
    
    return df_final


def run_migration():
    """Função principal que orquestra todo o processo de migração."""
    print("--- 🏁 INICIANDO MIGRAÇÃO DE DADOS 🏁 ---")
    sys.stdout.flush() 
    
    engine = get_db_engine()
    if engine is None:
        print("🔴 ERRO: Engine do DB não disponível. Abortando migração.")
        return

    # 1. Carregar Dados Brutos
    df_raw = _load_raw_data()
    if df_raw is None or df_raw.empty:
        print("🔴 ERRO: Falha ao carregar os dados brutos. Abortando.")
        return

    print(f"  -> Total de linhas brutas para processar: {len(df_raw)}")

    # 2. Transformar e Limpar
    df_final = _clean_and_finalize_data(df_raw)
    
    if df_final.empty:
        print("🔴 ERRO: DataFrame final está vazio após o processamento.")
        return

    print(f"  -> DataFrame final pronto para o DB com {len(df_final)} linhas.")

    # 3. Persistência no Banco de Dados
    print("\n💾 Iniciando Persistência no Banco de Dados...")
    try:
        # Usa engine.begin() para criar uma transação segura
        with engine.begin() as conn:
            # Substitui a tabela 'atividades' inteira com os novos dados
            df_final.to_sql('atividades', conn, if_exists='replace', index=False)
            print(f"🟢 SUCESSO: Migração da tabela 'atividades' concluída. {len(df_final)} linhas salvas.")

            # 4. Atualização do timestamp de migração
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS migration_log (
                        id INT PRIMARY KEY,
                        last_updated_at TIMESTAMP WITH TIME ZONE
                    )
                    """
                )
            )

            # Tenta atualizar; se não existir linha com id=1, insere
            result = conn.execute(
                text("UPDATE migration_log SET last_updated_at = CURRENT_TIMESTAMP WHERE id = 1")
            )
            
            if result.rowcount == 0:
                conn.execute(
                    text("INSERT INTO migration_log (id, last_updated_at) VALUES (1, CURRENT_TIMESTAMP)")
                )

            print("🟢 SUCESSO: Timestamp da migração salvo.")
            # O commit é feito automaticamente ao sair do bloco 'with engine.begin()'

    except Exception as e:
        print(f"🔴 ERRO durante a persistência no DB: {e}")

    print("\n--- ✅ MIGRAÇÃO CONCLUÍDA ---")

if __name__ == "__main__":
    run_migration()