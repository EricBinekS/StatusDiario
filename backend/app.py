# backend/app.py
from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.routes.dashboard_routes import dashboard_bp
from backend.routes.overview_routes import overview_bp
from backend.db.connection import get_db_engine
import sqlalchemy

app = Flask(__name__)

# Configuração CORS mais segura (Permite tudo por enquanto, mas centralizado)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Registro de Blueprints
app.register_blueprint(dashboard_bp, url_prefix='/api')
app.register_blueprint(overview_bp, url_prefix='/api')

@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "service": "Status App API 2.0",
        "version": "1.0.0"
    })

@app.route('/health')
def health_check():
    """Endpoint dedicado para verificação de saúde do sistema (Health Check)"""
    status = {"api": "online", "database": "unknown"}
    status_code = 200
    
    try:
        engine = get_db_engine()
        with engine.connect() as conn:
            conn.execute(sqlalchemy.text("SELECT 1"))
            status["database"] = "connected"
    except Exception as e:
        status["database"] = "error"
        status["error_details"] = str(e)
        status_code = 503
        
    return jsonify(status), status_code

if __name__ == '__main__':
    # Para rodar corretamente sem sys.path: python -m backend.app
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)