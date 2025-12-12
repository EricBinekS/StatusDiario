import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Carrega variáveis de ambiente (.env ou do sistema)
load_dotenv()

_engine = None

def get_db_engine():
    """
    Retorna o Singleton do Engine do Banco de Dados.
    Cria a conexão apenas na primeira chamada.
    """
    global _engine
    
    if _engine is not None:
        return _engine

    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("🔴 CRÍTICO: DATABASE_URL não definida!")
        return None

    try:
        # pool_recycle e pool_pre_ping evitam que o Render/Postgres derrube conexões ociosas
        _engine = create_engine(
            database_url, 
            pool_size=10, 
            pool_recycle=1800, 
            pool_pre_ping=True
        )
        print("🟢 DB: Engine inicializado com sucesso.")
        return _engine
    except Exception as e:
        print(f"🔴 DB: Erro ao criar engine: {e}")
        return None