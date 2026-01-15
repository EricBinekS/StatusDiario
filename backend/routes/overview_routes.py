from flask import Blueprint, jsonify, request
from backend.services.overview_service import get_overview_data

overview_bp = Blueprint('overview', __name__)

@overview_bp.route('/overview', methods=['GET'])
def overview():
    try:
        view_mode = request.args.get('view', 'semana') # semana, mes, hoje
        data = get_overview_data(view_mode)
        return jsonify(data)
    except Exception as e:
        print(f"Erro Overview Route: {e}")
        return jsonify([]), 500