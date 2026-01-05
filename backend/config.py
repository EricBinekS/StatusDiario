# backend/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DATABASE_URL = os.getenv("DATABASE_URL")
    PORT = int(os.environ.get("PORT", 8000))
    DEBUG = os.environ.get("FLASK_ENV") != "production"
    
    # Configurações do SQLAlchemy Engine
    DB_POOL_SIZE = 10
    DB_POOL_RECYCLE = 1800
    DB_POOL_PRE_PING = True

    @staticmethod
    def check_config():
        if not Config.DATABASE_URL:
            raise ValueError("CRÍTICO: DATABASE_URL não definida no .env")