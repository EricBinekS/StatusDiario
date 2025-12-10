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
    # Captura os parâmetros da URL
    # Aceita tanto 'startDate' (do frontend JS) quanto 'start_date' (padrão Python/Postman)
    start_date = request.args.get('startDate') or request.args.get('start_date')
    end_date = request.args.get('endDate') or request.args.get('end_date')
    
    # Captura o modo de visualização ('semana' ou 'mes'), padrão é 'semana'
    view_mode = request.args.get('viewMode') or request.args.get('view_mode', 'semana')
    
    try:
        # Passa os 3 parâmetros para o serviço atualizado
        data = get_overview_data(start_date, end_date, view_mode)
        return jsonify(data)
    except Exception as e:
        print(f"Erro na rota Overview: {e}")
        return jsonify({"error": str(e), "data": []}), 500