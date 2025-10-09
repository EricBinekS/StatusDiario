from flask import Flask, jsonify, Response
from flask_cors import CORS
from pathlib import Path
import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv
import subprocess 
from flask_socketio import SocketIO

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

try:
    SCRIPT_DIR = Path(__file__).resolve().parent
    DB_PATH = SCRIPT_DIR / "painel_data.db"
    engine = create_engine(f'sqlite:///{DB_PATH}')
    print(f"Servidor conectado ao banco de dados em: {DB_PATH}")
except Exception as e:
    print(f"ERRO CRÍTICO ao configurar o caminho do banco de dados: {e}")
    engine = None

@app.route("/api/atividades")
def get_atividades():
    print("Recebida requisição para /api/atividades. Consultando banco de dados...")
    try:
        df = pd.read_sql('SELECT * FROM atividades', engine)
        df = df.where(pd.notna(df), None)
        json_string = df.to_json(orient="records", date_format="iso", default_handler=str)
        print(f"Consulta concluída. {len(df)} registros encontrados.")
        return Response(json_string, mimetype='application/json')
    except Exception as e:
        print(f"ERRO ao consultar o banco de dados: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/trigger-update", methods=['POST'])
def trigger_update():
    """
    Este endpoint aciona o script de migração para recarregar os dados
    e depois avisa os clientes via WebSocket que os dados mudaram.
    """
    print("Recebido gatilho de atualização. Rodando a migração...")
    try:
        script_path = Path(__file__).parent / "migrate_to_db.py"
        subprocess.run(["python", str(script_path)], check=True, capture_output=True, text=True)
        print("Migração concluída. Emitindo evento 'data_updated' para os clientes.")
        socketio.emit('data_updated', {'message': 'Dados do painel foram atualizados!'})
        
        return jsonify({"status": "success", "message": "Data updated and event emitted."})
    except subprocess.CalledProcessError as e:
        print(f"ERRO ao executar a migração: {e.stderr}")
        return jsonify({"status": "error", "message": e.stderr}), 500
    except Exception as e:
        print(f"ERRO inesperado no trigger: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    print("Iniciando servidor com suporte a WebSockets...")
    socketio.run(app, debug=True, port=5000)