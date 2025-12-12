from flask import Blueprint, jsonify, request
from services.dashboard_service import get_dashboard_data

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/atividades', methods=['GET'])
def list_atividades():
    try:
        # Futuramente podemos passar filtros via request.args
        data = get_dashboard_data()
        return jsonify(data)
    except Exception as e:
        # Loga no servidor, mas responde JSON válido para o React
        print(f"Erro na Rota Dashboard: {e}")
        return jsonify([]), 200 # Retorna vazio, não erro 500