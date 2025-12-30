from sqlalchemy import text
from backend.db.connection import get_db_engine

def optimize_database():
    engine = get_db_engine()
    if not engine:
        print("❌ Erro: Engine não conectada.")
        return

    print("🧹 Iniciando otimização (VACUUM ANALYZE)...")
    try:
        with engine.connect() as conn:
            # Força o modo autocommit para rodar VACUUM
            conn.execution_options(isolation_level="AUTOCOMMIT").execute(text("VACUUM ANALYZE atividades;"))
            
        print("✅ Otimização concluída! O banco agora deve usar os índices corretamente.")
    except Exception as e:
        print(f"⚠️ Aviso: {e}")
        print("Nota: Alguns bancos em nuvem não permitem VACUUM via código. Se deu erro, confie apenas no timeout aumentado.")

if __name__ == "__main__":
    optimize_database()