from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Variável global para o engine
engine = None

try:
    if not DATABASE_URL:
        print("AVISO: DATABASE_URL não encontrada.")
    else:
        # Pool size e recycle ajudam a manter a conexão estável no Render
        engine = create_engine(DATABASE_URL, pool_size=10, pool_recycle=1800)
        print("Engine do Banco de Dados criado com sucesso.")
except Exception as e:
    print(f"ERRO CRÍTICO ao criar engine: {e}")

def get_db_engine():
    """Retorna o engine para uso nas rotas/services."""
    return engine

def init_db():
    """Testa a conexão ao iniciar a API."""
    if engine:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("DB: Conexão de teste bem-sucedida.")
        except Exception as e:
            print(f"DB: Falha na conexão de teste. {e}")
    else:
        print("DB: Engine não está configurado.")