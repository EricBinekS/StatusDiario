from flask import Flask, jsonify
from flask_cors import CORS
from db.database import init_db

# Importando as rotas
from routes.atividades_route import atividades_bp
from routes.overview_route import overview_bp

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "*"}})

# Inicializa Banco de Dados
init_db()

# Registro das Rotas
app.register_blueprint(atividades_bp, url_prefix='/api')
app.register_blueprint(overview_bp, url_prefix='/api')

@app.route("/")
def read_root():
    return jsonify({
        "status": "online",
        "message": "Status Diário API is running correctly.",
        "cors": "open-to-all"
    })

if __name__ == "__main__":
    app.run(debug=True, port=8000)