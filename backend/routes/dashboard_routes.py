from flask import Blueprint, jsonify, request
# Import absoluto para não dar erro no Render
from backend.services.dashboard_service import get_dashboard_data, get_last_migration_time

dashboard_bp = Blueprint('dashboard', __name__)

# Rota para dados do dashboard (mantém compatibilidade e usa nova ordenação)
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

# NOVA ROTA para o timer de atualização
@dashboard_bp.route('/last-update', methods=['GET'])
def get_last_update():
    try:
        data = get_last_migration_time()
        return jsonify(data), 200
    except Exception as e:
        print(f"Erro na Rota Last Update: {e}")
        # Retorna 200 com valor nulo para o frontend conseguir processar
        return jsonify({"last_updated_at": None}), 200