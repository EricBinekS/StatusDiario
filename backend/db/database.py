from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

try:
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL não está definida nas variáveis de ambiente.")
    engine = create_engine(DATABASE_URL)
    print("Servidor conectado ao banco de dados PostgreSQL via DATABASE_URL.")
except Exception as e:
    print(f"ERRO CRÍTICO ao configurar o engine do banco de dados: {e}")
    engine = None

def get_db_engine():
    """Retorna o objeto SQLAlchemy Engine."""
    return engine