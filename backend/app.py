from flask import Flask, jsonify
from flask_cors import CORS
import os
import sqlalchemy

from backend.db.connection import get_db_engine
from backend.routes.dashboard_routes import dashboard_bp
from backend.routes.overview_routes import overview_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.register_blueprint(dashboard_bp, url_prefix='/api')
app.register_blueprint(overview_bp, url_prefix='/api')

@app.route('/')
def home():
    routes = [str(p) for p in app.url_map.iter_rules()]
    return jsonify({
        "status": "API Status Diário Online 🚀", 
        "routes_available": routes
    })

@app.route('/api/test-db')
def test_db():
    try:
        engine = get_db_engine()
        with engine.connect() as conn:
            # Tenta executar uma query simples
            result = conn.execute(sqlalchemy.text("SELECT 1")).scalar()
            return jsonify({
                "database": "Conectado ✅", 
                "test_query_result": result
            }), 200
    except Exception as e:
        print(f"Erro no DB: {e}")
        return jsonify({
            "database": "Erro de Conexão ❌", 
            "details": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    app.run(host='0.0.0.0', port=port, debug=True)