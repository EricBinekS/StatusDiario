import sys
import os
import glob
import json
import pandas as pd
from sqlalchemy import text

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from db.connection import get_db_engine
from etl.processor import process_dataframe, clean_column_names

def load_raw_files():
    """Lê todos os Excels da pasta raw_data."""
    raw_path = os.path.join(backend_dir, "raw_data")
    map_path = os.path.join(current_dir, "mapeamento_abas.json")
    
    print(f"📂 Lendo arquivos de: {raw_path}")
    
    try:
        with open(map_path, 'r') as f:
            aba_map = json.load(f)
    except FileNotFoundError:
        print("🔴 Arquivo mapeamento_abas.json não encontrado.")
        return []

    all_files = glob.glob(os.path.join(raw_path, "*.xlsx"))
    dfs = []

    for file_path in all_files:
        filename = os.path.basename(file_path)
        sheet_name = aba_map.get(filename)
        
        if not sheet_name:
            print(f"⚠️ Pulei {filename} (sem mapeamento).")
            continue
            
        print(f"📄 Processando {filename} (Aba: {sheet_name})...")
        try:
            temp = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
            
            header = temp.iloc[4]
            data = temp.iloc[5:].copy()
            
            data.columns = clean_column_names(header)
        
            if 'ativo' in data.columns:
                dfs.append(data)
            else:
                print(f"⚠️ {filename}: Coluna 'ativo' não encontrada.")
                
        except Exception as e:
            print(f"🔴 Erro em {filename}: {e}")

    return dfs

def run():
    print("🚀 Iniciando Migração ETL...")
    
    engine = get_db_engine()
    if not engine:
        sys.exit(1)

    raw_dfs = load_raw_files()
    if not raw_dfs:
        print("⚠️ Nenhum dado bruto encontrado.")
        sys.exit(0)

    print("⚙️ Unificando dados...")
    full_df = pd.concat(raw_dfs, ignore_index=True)
    clean_df = process_dataframe(full_df)
    
    print(f"📊 Linhas prontas para inserção: {len(clean_df)}")

    try:
        with engine.begin() as conn:
            clean_df.to_sql('atividades', conn, if_exists='replace', index=False)
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS migration_log (
                    id INT PRIMARY KEY, 
                    last_updated_at TIMESTAMP DEFAULT NOW()
                );
                INSERT INTO migration_log (id, last_updated_at) VALUES (1, NOW())
                ON CONFLICT (id) DO UPDATE SET last_updated_at = NOW();
            """))
            
        print("✅ SUCESSO: Banco de dados atualizado!")
        
    except Exception as e:
        print(f"🔴 FALHA AO SALVAR NO BANCO: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run()