from sqlalchemy import text
from backend.db.connection import get_db_engine

def create_indexes():
    engine = get_db_engine()
    if not engine:
        print("❌ Erro: Engine não conectada.")
        return

    commands = [
        # Índice simples para datas
        "CREATE INDEX IF NOT EXISTS idx_atividades_data ON atividades (data);",
        
        # Índice Composto (A "Bala de Prata" para o seu Dashboard)
        # Ele otimiza o filtro (WHERE data) E a ordenação (ORDER BY status, inicio) ao mesmo tempo.
        "CREATE INDEX IF NOT EXISTS idx_dashboard_full ON atividades (data, status, inicio_prog);"
    ]

    print("⏳ Conectando ao banco...")
    
    try:
        with engine.connect() as conn:
            # --- O PULO DO GATO ---
            # Define o timeout como 0 (sem limite) apenas para esta sessão.
            # Isso impede que o banco cancele a criação se demorar muito.
            print("🔧 Configurando sessão para tempo ilimitado...")
            conn.execute(text("SET statement_timeout = 0;"))
            conn.commit()

            print("🚀 Iniciando criação dos índices (Isso pode levar alguns minutos, não feche!)...")
            
            # Executa os comandos
            for cmd in commands:
                print(f"Executando: {cmd}")
                conn.execute(text(cmd))
                conn.commit() # Commit a cada índice para garantir

        print("✅ SUCESSO! Índices criados.")
        
    except Exception as e:
        print(f"❌ Erro fatal: {e}")

if __name__ == "__main__":
    create_indexes()