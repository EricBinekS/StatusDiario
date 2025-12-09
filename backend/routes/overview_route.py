from flask import Blueprint, jsonify, request
from services.overview_service import get_overview_data

# Cria o Blueprint
overview_bp = Blueprint('overview_bp', __name__)

@overview_bp.route("/overview", methods=["GET"])
def get_overview():
    """
    Retorna JSON agregado para o painel gerencial.
    Rota final: /api/overview
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    try:
        data = get_overview_data(start_date, end_date)
        return jsonify(data)
    except Exception as e:
        print(f"Erro na rota Overview: {e}")
        return jsonify({"error": str(e), "data": []}), 500