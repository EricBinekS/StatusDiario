from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Carrega variáveis locais (apenas em dev)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Configuração do Engine
try:
    if not DATABASE_URL:
        # Em produção, o print pode aparecer nos logs
        print("AVISO: DATABASE_URL não encontrada. O backend pode falhar ao conectar.")
        engine = None
    else:
        engine = create_engine(DATABASE_URL)
        print("Servidor conectado ao banco de dados via DATABASE_URL.")
except Exception as e:
    print(f"ERRO CRÍTICO ao configurar o engine do banco de dados: {e}")
    engine = None

def get_db_engine():
    """Retorna o objeto SQLAlchemy Engine."""
    return engine

def init_db():
    """
    Função chamada pelo main.py ao iniciar.
    Pode ser usada para criar tabelas (metadata.create_all) no futuro.
    Por enquanto, serve apenas para validar a conexão inicial.
    """
    if engine:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("Inicialização do DB: Conexão bem-sucedida.")
        except Exception as e:
            print(f"Inicialização do DB: Falha ao conectar. {e}")
    else:
        print("Inicialização do DB: Engine não configurado.")