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
CORS(app)

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
        df = pd.read_sql('SELECT * FROM atividades', engine)
        df = df.where(pd.notna(df), None)
        
        json_string = df.to_json(orient="records", date_format="iso")
        data_list = json.loads(json_string)

        now_utc = datetime.datetime.now(datetime.timezone.utc).isoformat()

        print(f"Consulta concluída. {len(data_list)} registros encontrados.")
        
        return jsonify({
            "data": data_list,
            "last_updated": now_utc
        })
    except Exception as e:
        print(f"ERRO ao consultar o banco de dados: {e}")
        return jsonify({"error": str(e), "data": [], "last_updated": None}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)