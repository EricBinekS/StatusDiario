from flask import Blueprint, jsonify, request
# Import absoluto para não dar erro no Render
from backend.services.dashboard_service import get_dashboard_data

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
@dashboard_bp.route('/atividades', methods=['GET'])
def list_atividades():
    try:
        data_filter = request.args.get('data')
        filters = {"data": data_filter} if data_filter else None
        
        data = get_dashboard_data(filters)
        return jsonify(data)
    except Exception as e:
        print(f"Erro na Rota Dashboard: {e}")
        return jsonify([]), 200