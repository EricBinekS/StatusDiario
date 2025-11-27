from flask import Blueprint, jsonify
from sqlalchemy import text
import datetime
import json
import pandas as pd
from zoneinfo import ZoneInfo
from ..db.database import get_db_engine

# Criação do Blueprint
atividades_bp = Blueprint('atividades_bp', __name__)

BR_TZ = ZoneInfo("America/Sao_Paulo")

@atividades_bp.route("/atividades", methods=["GET"])
def get_atividades():
    engine = get_db_engine()
    if engine is None:
        return jsonify({"error": "Configuração do Banco de Dados falhou.", "data": [], "last_updated": None}), 503

    print("Recebida requisição para /api/atividades. Consultando banco de dados...")
    
    try:
        with engine.connect() as conn:
            
            # 1. Consulta Principal
            print("Consultando tabela 'atividades'...")
            df = pd.read_sql('SELECT * FROM atividades', conn) 
            df = df.where(pd.notna(df), None)
            
            json_string = df.to_json(orient="records", date_format="iso")
            data_list = json.loads(json_string)
            print(f"Consulta 'atividades' concluída. {len(data_list)} registros.")

            # 2. Consulta de Timestamp
            last_updated = None
            try:
                print("Consultando 'migration_log'...")
                query = text("SELECT last_updated_at FROM migration_log WHERE id = 1")
                result = conn.execute(query)
                timestamp_row = result.fetchone()
                
                if timestamp_row and timestamp_row[0]:
                    db_timestamp = timestamp_row[0] 
                    if db_timestamp.tzinfo is None:
                        # Trata timestamps sem fuso horário (naive) forçando UTC para consistência
                        db_timestamp = db_timestamp.replace(tzinfo=datetime.timezone.utc)
                    last_updated = db_timestamp.isoformat()
                else:
                    last_updated = datetime.datetime.now(BR_TZ).isoformat()

            except Exception as e_log:
                print(f"ERRO ao consultar 'migration_log': {e_log}. Usando hora atual como fallback.")
                last_updated = datetime.datetime.now(BR_TZ).isoformat()

            return jsonify({
                "data": data_list,
                "last_updated": last_updated 
            })
            
    except Exception as e:
        print(f"ERRO CRÍTICO ao consultar o banco de dados: {e}")
        return jsonify({"error": str(e), "data": [], "last_updated": None}), 500