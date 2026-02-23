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
    
    if not os.path.exists(map_path):
        print("⚠️ Criando mapeamento padrão...")
        default_map = {"FN_MC.xlsx": "FN_MC", "SP_NORTE.xlsx": "SP_NORTE", "SP_SUL.xlsx": "SP_SUL"}
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

    print(f"📂 Verificando {len(all_files)} arquivos em: {raw_path}")

    for file_path in all_files:
        filename = os.path.basename(file_path)
        sheet_name = aba_map.get(filename)
        
        if not sheet_name:
            print(f"⚠️ {filename}: Sem mapeamento de aba.")
            continue
            
        try:
            temp = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
            print(f"🔍 {filename}: Total de linhas lidas: {len(temp)}")
            
            if len(temp) < 6:
                print(f"⚠️ {filename}: Linhas insuficientes (< 6).")
                continue

            header = temp.iloc[4]
            data = temp.iloc[5:].copy()
            data.columns = clean_column_names(header)
            
            print(f"   📊 Colunas detectadas: {list(data.columns[:5])}...")
        
            if 'ativo' in data.columns:
                dfs.append(data)
                print(f"   ✅ {filename}: {len(data)} linhas capturadas.")
            else:
                print(f"   ⚠️ {filename}: Coluna 'ativo' não encontrada no header (Linha 5).")
                
        except Exception as e:
            print(f"   🔴 Erro em {filename}: {e}")

    return dfs

def run():
    print("\n🚀 INICIANDO MIGRAÇÃO AUTOMATIZADA")
    print("===========================================")
    
    engine = get_db_engine()
    if not engine:
        sys.exit(1)

    raw_dfs = load_raw_files()
    if not raw_dfs:
        print("❌ Erro: Nenhum DataFrame carregado. Verifique os arquivos Excel.")
        sys.exit(0)

    print("\n⚙️ Unificando e transformando dados...")
    full_df = pd.concat(raw_dfs, ignore_index=True)
    print(f"📝 Total bruto antes do ETL: {len(full_df)}")
    
    clean_df = process_dataframe(full_df)
    
    if clean_df.empty:
        print("❌ Erro: O processamento (ETL) resultou em 0 registros. Verifique filtros de data e atividade.")
        sys.exit(0)

    clean_df.reset_index(inplace=True) 
    clean_df.rename(columns={'index': 'id'}, inplace=True)

    print(f"📊 Dados prontos para inserção: {len(clean_df)} registros.")

    print("💾 Inserindo no banco de dados...")
    try:
        with engine.begin() as conn:
            # Aumenta o timeout da sessão para esta transação específica
            conn.execute(text("SET statement_timeout = '60s';"))
            
            print("   (1/3) Substituindo tabela 'atividades'...")
            clean_df.to_sql(
                'atividades', 
                conn, 
                if_exists='replace', 
                index=False,
                chunksize=1000 
            )
            
            print("   (2/3) Definindo Chave Primária...")
            conn.execute(text("ALTER TABLE atividades ADD PRIMARY KEY (id);"))
            
            print("   (3/3) Atualizando log de migração...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS migration_log (
                    id INT PRIMARY KEY, 
                    last_updated_at TIMESTAMP DEFAULT NOW()
                );
                INSERT INTO migration_log (id, last_updated_at) VALUES (1, NOW())
                ON CONFLICT (id) DO UPDATE SET last_updated_at = NOW();
            """))
            
        print("✅ Dados inseridos com sucesso!")

        print("\n🔧 Tarefas pós-migração...")
        create_indexes()
        optimize_database()

        print("\n✨ MIGRAÇÃO CONCLUÍDA! ✨")
        
    except Exception as e:
        print(f"\n🔴 FALHA CRÍTICA: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run()
