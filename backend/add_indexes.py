from sqlalchemy import text
from backend.db.connection import get_db_engine

def create_indexes():
    """Cria índices otimizados para o Dashboard."""
    engine = get_db_engine()
    if not engine:
        print("❌ DB: Engine não conectada para indexação.")
        return

    commands = [
        "CREATE INDEX IF NOT EXISTS idx_atividades_data ON atividades (data);",
        "CREATE INDEX IF NOT EXISTS idx_dashboard_full ON atividades (data, status, inicio_prog);"
    ]

    print("⏳ DB: Verificando/Criando índices...")
    
    try:
        with engine.connect() as conn:
            # Define timeout infinito para garantir criação
            conn.execute(text("SET statement_timeout = 0;"))
            conn.commit()

            for cmd in commands:
                conn.execute(text(cmd))
                conn.commit()

        print("✅ DB: Índices sincronizados.")
        
    except Exception as e:
        print(f"❌ DB: Erro ao criar índices: {e}")

if __name__ == "__main__":
    create_indexes()