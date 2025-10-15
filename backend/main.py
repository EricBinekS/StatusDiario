from flask import Flask, jsonify, Response, request # Adicionado 'request'
from flask_cors import CORS
from pathlib import Path
import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv
import subprocess 
from flask_socketio import SocketIO

load_dotenv()
app = Flask(__name__)
CORS(app) 
socketio = SocketIO(app, cors_allowed_origins="*")

DATABASE_URL = os.getenv("DATABASE_URL")
MIGRATION_SECRET_KEY = os.getenv("MIGRATION_SECRET_KEY")

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
    """
    Endpoint para buscar todos os dados da tabela 'atividades' no Neon.
    """
    if engine is None:
        return jsonify({"error": "Configuração do Banco de Dados falhou."}), 503
        
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
    Endpoint de gatilho acionado pelo GitHub Action para rodar a migração.
    Requer a chave secreta no cabeçalho 'X-Migration-Key'.
    """

    if not MIGRATION_SECRET_KEY:
        print("ERRO DE CONFIGURAÇÃO: MIGRATION_SECRET_KEY não definida no servidor.")
        return jsonify({"status": "error", "message": "Server secret key is missing."}), 500

    received_key = request.headers.get('X-Migration-Key')
    
    if received_key != MIGRATION_SECRET_KEY:
        print(f"Tentativa de acesso não autorizada ao trigger. Chave recebida: {received_key}")
        return jsonify({"status": "error", "message": "Unauthorized access."}), 401
    
    print("Recebido gatilho de atualização. Rodando a migração...")
    try:
        script_path = Path(__file__).parent / "migrate_to_db.py"
        
        env_vars = os.environ.copy()
        env_vars['DATABASE_URL'] = DATABASE_URL
        
        result = subprocess.run(
            ["python", str(script_path)], 
            check=True, 
            capture_output=True, 
            text=True,
            env=env_vars
        )
        
        print(f"Migração concluída com sucesso. Output:\n{result.stdout}")

        socketio.emit('data_updated', {'message': 'Dados do painel foram atualizados!'})
        
        return jsonify({"status": "success", "message": "Data updated and event emitted."})
    except subprocess.CalledProcessError as e:
        print(f"ERRO ao executar a migração: {e.stderr}")
        return jsonify({"status": "error", "message": f"Migration failed: {e.stderr}"}), 500
    except Exception as e:
        print(f"ERRO inesperado no trigger: {e}")
        return jsonify({"status": "error", "message": f"Unexpected error: {str(e)}"}), 500


if __name__ == "__main__":
    print("Iniciando servidor com suporte a WebSockets...")
    socketio.run(app, debug=True, port=5000)