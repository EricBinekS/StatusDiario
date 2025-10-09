from flask import Flask, jsonify, Response
from flask_cors import CORS
import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env (deve estar na mesma pasta 'backend')
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Conexão com o Banco de Dados na Nuvem (Neon) ---
DATABASE_URL = os.getenv("DATABASE_URL")
engine = None
if DATABASE_URL:
    try:
        engine = create_engine(DATABASE_URL)
        print("Servidor configurado para conectar ao banco de dados na nuvem.")
    except Exception as e:
        print(f"ERRO CRÍTICO ao configurar a conexão com o banco de dados: {e}")
else:
    print("ERRO CRÍTICO: Variável DATABASE_URL não encontrada. Verifique seu arquivo .env")


@app.route("/api/atividades")
def get_atividades():
    """Lê os dados do banco de dados e os retorna como JSON."""
    print("Recebida requisição para /api/atividades. Consultando banco de dados...")
    if engine is None:
        return jsonify({"error": "A conexão com o banco de dados não foi configurada"}), 500
    try:
        df = pd.read_sql('SELECT * FROM atividades', engine)
        
        # Converte NaN para None antes de serializar para JSON
        df = df.where(pd.notna(df), None)

        json_string = df.to_json(orient="records", date_format="iso", default_handler=str)
        
        print(f"Consulta concluída. {len(df)} registros encontrados.")
        return Response(json_string, mimetype='application/json')
    except Exception as e:
        print(f"ERRO ao consultar o banco de dados: {e}")
        if "no such table" in str(e):
             print("AVISO: Tabela 'atividades' não encontrada. Você já rodou o script 'migrate_to_db.py'?")
             return jsonify([])
        return jsonify({"error": "Falha ao buscar dados do banco de dados"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)