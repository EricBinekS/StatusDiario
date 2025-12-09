from flask import Flask, jsonify
from flask_cors import CORS
from .db.database import init_db

# Importando as rotas
from .routes.atividades_route import atividades_bp
from .routes.overview_route import overview_bp

app = Flask(__name__)

# Configuração de CORS (Permite conexão do Frontend Vite)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# Inicializa Banco de Dados
init_db()

# Registro das Rotas (Blueprints)
# O url_prefix='/api' faz as rotas serem /api/atividades e /api/overview
app.register_blueprint(atividades_bp, url_prefix='/api')
app.register_blueprint(overview_bp, url_prefix='/api')

@app.route("/")
def read_root():
    return jsonify({"message": "Status Diário API is running (Flask)"})

if __name__ == "__main__":
    app.run(debug=True, port=8000)