from flask import Flask, jsonify, Response
from flask_cors import CORS
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv
import pandas as pd
import datetime
import json

load_dotenv()

app = Flask(__name__)
CORS(app, origins="*") 

DATABASE_URL = os.getenv("DATABASE_URL")

try:
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL não está definida nas variáveis de ambiente.")
    engine = create_engine(DATABASE_URL)
    print("Servidor conectado ao banco de dados Neon via DATABASE_URL.")
except Exception as e:
    print(f"ERRO CRÍTICO ao configurar o engine do banco de dados: {e}")
    engine = None

@app.route("/api/atividades")
def get_atividades():
    if engine is None:
        return jsonify({"error": "Configuração do Banco de Dados falhou.", "data": [], "last_updated": None}), 503

    print("Recebida requisição para /api/atividades. Consultando banco de dados...")
    
    try:
        with engine.connect() as conn:
            
            print("Consultando tabela 'atividades'...")
            df = pd.read_sql('SELECT * FROM atividades', conn) 
            df = df.where(pd.notna(df), None)
            
            json_string = df.to_json(orient="records", date_format="iso")
            data_list = json.loads(json_string)
            print(f"Consulta 'atividades' concluída. {len(data_list)} registros.")

            last_updated = None
            try:
                print("Consultando 'migration_log'...")
                result = conn.execute("SELECT last_updated_at FROM migration_log WHERE id = 1")
                timestamp_row = result.fetchone()
                
                if timestamp_row and timestamp_row[0]:
                    last_updated = timestamp_row[0].isoformat()
                    print(f"Timestamp da migração encontrado: {last_updated}")
                else:
                    print("Nenhum timestamp na 'migration_log'. Usando hora atual como fallback.")
                    last_updated = datetime.datetime.now(datetime.timezone.utc).isoformat()

            except Exception as e_log:

                print(f"ERRO ao consultar 'migration_log' (tabela pode não existir): {e_log}. Usando hora atual como fallback.")
                last_updated = datetime.datetime.now(datetime.timezone.utc).isoformat()

            return jsonify({
                "data": data_list,
                "last_updated": last_updated 
            })
            
    except Exception as e:
        print(f"ERRO CRÍTICO ao consultar o banco de dados: {e}")
        return jsonify({"error": str(e), "data": [], "last_updated": None}), 500

if __name__ == "__main__":
    app.run(debug=False, host='0.0.0.0', port=int(os.getenv("PORT", 5000)))