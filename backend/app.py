from flask import Flask, jsonify
from flask_cors import CORS
from db.connection import get_db_engine # Apenas para testar conexão na inicialização

# Importa as rotas novas
from routes.dashboard_routes import dashboard_bp
from routes.overview_routes import overview_bp

app = Flask(__name__)

# Configuração CORS permissiva para evitar dores de cabeça em dev/prod
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Teste inicial de DB (Opcional, mas bom para debug no log do Render)
with app.app_context():
    get_db_engine()

# Registro de Blueprints
app.register_blueprint(dashboard_bp, url_prefix='/api')
app.register_blueprint(overview_bp, url_prefix='/api')

@app.route("/")
def health_check():
    return jsonify({"status": "API Online", "version": "2.0 (Refactored)"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)