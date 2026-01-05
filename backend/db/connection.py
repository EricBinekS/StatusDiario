# backend/db/connection.py
from sqlalchemy import create_engine
from backend.config import Config

_engine = None

def get_db_engine():
    """
    Retorna o Singleton do Engine do Banco de Dados.
    """
    global _engine
    
    if _engine:
        return _engine

    # Validação inicial da configuração
    try:
        Config.check_config()
        
        _engine = create_engine(
            Config.DATABASE_URL,
            pool_size=Config.DB_POOL_SIZE,
            pool_recycle=Config.DB_POOL_RECYCLE,
            pool_pre_ping=Config.DB_POOL_PRE_PING
        )
        print(f"🟢 DB: Engine conectado com sucesso.")
        return _engine
    except Exception as e:
        print(f"🔴 DB: Erro fatal ao criar engine: {e}")
        return None