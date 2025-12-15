from flask import Flask, jsonify
from flask_cors import CORS
import os

from backend.db.connection import get_db_engine
from backend.routes.dashboard_routes import dashboard_bp

app = Flask(__name__)
CORS(app) # Habilita CORS para o Frontend conectar

# Registrar Blueprints (Rotas)
app.register_blueprint(dashboard_bp)
# app.register_blueprint(overview_bp)

@app.route('/')
def home():
    return jsonify({"message": "API Status Diário Online 🚀", "status": "ok"})

@app.route('/api/test-db')
def test_db():
    try:
        engine = get_db_engine()
        with engine.connect() as conn:
            # Teste simples de conexão
            result = conn.execute("SELECT 1").scalar()
            return jsonify({"database": "Conectado", "result": result}), 200
    except Exception as e:
        return jsonify({"database": "Erro", "details": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    # debug=True ajuda a ver erros detalhados no desenvolvimento
    app.run(host='0.0.0.0', port=port, debug=True)