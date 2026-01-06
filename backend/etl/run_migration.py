import sys
import os
import glob
import json
import pandas as pd
import warnings
from sqlalchemy import text

# Silencia avisos do OpenPyXL
warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')

# --- CORREÇÃO DE PATH ---
# Garante que a raiz do projeto esteja no sys.path para permitir imports absolutos (ex: backend.config)
current_dir = os.path.dirname(os.path.abspath(__file__)) # .../backend/etl
backend_dir = os.path.dirname(current_dir)             # .../backend
project_root = os.path.dirname(backend_dir)            # .../ (Raiz)

if project_root not in sys.path:
    sys.path.append(project_root)

# Agora usamos imports absolutos (padrão App 3.0)
from backend.db.connection import get_db_engine
from backend.etl.processor import process_dataframe, clean_column_names
from backend.add_indexes import create_indexes
from backend.optimize_db import optimize_database

def load_raw_files():
    # Caminhos absolutos baseados no backend_dir
    raw_path = os.path.join(backend_dir, "raw_data")
    map_path = os.path.join(current_dir, "mapeamento_abas.json")
    
    try:
        with open(map_path, 'r', encoding='utf-8') as f:
            aba_map = json.load(f)
    except FileNotFoundError:
        print("🔴 Mapeamento (mapeamento_abas.json) não encontrado.")
        return []

    all_files = glob.glob(os.path.join(raw_path, "*.xlsx"))
    dfs = []

    print(f"📂 Processando {len(all_files)} arquivos de: {raw_path}")

    for file_path in all_files:
        filename = os.path.basename(file_path)
        sheet_name = aba_map.get(filename)
        
        if not sheet_name:
            continue
            
        try:
            # Lê apenas cabeçalho primeiro
            temp = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
            
            header = temp.iloc[4]
            data = temp.iloc[5:].copy()
            data.columns = clean_column_names(header)
        
            if 'ativo' in data.columns:
                dfs.append(data)
                print(f"  └── ✅ {filename} (Aba: {sheet_name})")
            else:
                print(f"  └── ⚠️ {filename}: Coluna 'ativo' ausente.")
                
        except Exception as e:
            print(f"  └── 🔴 Erro em {filename}: {e}")

    return dfs

def run():
    print("\n🚀 INICIANDO MIGRAÇÃO AUTOMATIZADA (App 3.0)")
    print("===========================================")
    
    engine = get_db_engine()
    if not engine:
        sys.exit(1)

    # 1. Carregar Dados
    raw_dfs = load_raw_files()
    if not raw_dfs:
        print("⚠️ Nenhum dado para processar. Encerrando.")
        sys.exit(0)

    # 2. Processar (ETL)
    print("\n⚙️ Unificando e transformando dados...")
    full_df = pd.concat(raw_dfs, ignore_index=True)
    clean_df = process_dataframe(full_df)
    
    clean_df.reset_index(inplace=True) 
    clean_df.rename(columns={'index': 'id'}, inplace=True)

    total_rows = len(clean_df)
    print(f"📊 Dados prontos: {total_rows} registros.")

    # 3. Inserção no Banco
    print("💾 Inserindo no banco de dados...")
    try:
        with engine.begin() as conn:
            clean_df.to_sql(
                'atividades', 
                conn, 
                if_exists='replace', 
                index=False,
                chunksize=2000 
            )
            
            conn.execute(text("ALTER TABLE atividades ADD PRIMARY KEY (id);"))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS migration_log (
                    id INT PRIMARY KEY, 
                    last_updated_at TIMESTAMP DEFAULT NOW()
                );
                INSERT INTO migration_log (id, last_updated_at) VALUES (1, NOW())
                ON CONFLICT (id) DO UPDATE SET last_updated_at = NOW();
            """))
            
        print("✅ Dados inseridos com sucesso!")

        # 4. Pós-Processamento
        print("\n🔧 Executando tarefas de manutenção pós-migração...")
        create_indexes()
        optimize_database()

        print("\n✨ MIGRAÇÃO CONCLUÍDA COM SUCESSO! ✨")
        
    except Exception as e:
        print(f"\n🔴 FALHA CRÍTICA NA MIGRAÇÃO: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run()