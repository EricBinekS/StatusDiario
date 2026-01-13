import sys
import os
import glob
import json
import pandas as pd
import warnings
from sqlalchemy import text

# Silencia avisos do OpenPyXL
warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')

# Setup de path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
project_root = os.path.dirname(backend_dir)

if project_root not in sys.path:
    sys.path.append(project_root)

from backend.db.connection import get_db_engine
from backend.etl.processor import process_dataframe, clean_column_names
from backend.add_indexes import create_indexes
from backend.optimize_db import optimize_database

def load_raw_files():
    raw_path = os.path.join(backend_dir, "raw_data")
    map_path = os.path.join(current_dir, "mapeamento_abas.json")
    
    # Se o arquivo JSON não existir, cria um padrão (Fallback)
    if not os.path.exists(map_path):
        print("⚠️ Criando mapeamento padrão...")
        default_map = {
            "FN_MC.xlsx": "FN_MC",
            "SP_NORTE.xlsx": "SP_NORTE",
            "SP_SUL.xlsx": "SP_SUL"
        }
        with open(map_path, 'w') as f:
            json.dump(default_map, f)
    
    try:
        with open(map_path, 'r', encoding='utf-8') as f:
            aba_map = json.load(f)
    except Exception as e:
        print(f"🔴 Erro ao ler mapeamento: {e}")
        return []

    all_files = glob.glob(os.path.join(raw_path, "*.xlsx"))
    dfs = []

    print(f"📂 Processando {len(all_files)} arquivos de: {raw_path}")

    for file_path in all_files:
        filename = os.path.basename(file_path)
        sheet_name = aba_map.get(filename)
        
        if not sheet_name:
            print(f"⚠️ {filename}: Sem mapeamento de aba. Pulando.")
            continue
            
        try:
            # Lê cabeçalho na linha 4 (índice 4 do Excel = linha 5 visual)
            temp = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
            
            if len(temp) < 6:
                print(f"⚠️ {filename}: Arquivo muito curto.")
                continue

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
    print("\n🚀 INICIANDO MIGRAÇÃO AUTOMATIZADA (Original Restaurado)")
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
    
    # Chama o processador que agora tem a regra de Status Nova
    clean_df = process_dataframe(full_df)
    
    clean_df.reset_index(inplace=True) 
    clean_df.rename(columns={'index': 'id'}, inplace=True)

    total_rows = len(clean_df)
    print(f"📊 Dados prontos: {total_rows} registros.")

    # 3. Inserção no Banco (Bulk Insert com Replace)
    print("💾 Inserindo no banco de dados...")
    try:
        with engine.begin() as conn:
            clean_df.to_sql(
                'atividades', 
                conn, 
                if_exists='replace', # Recria a tabela do zero (corrige erro de schema)
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