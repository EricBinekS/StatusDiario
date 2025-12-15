from flask import Blueprint, jsonify, request
from backend.services.dashboard_service import DashboardService

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    # Recebe ?data=2023-12-09
    data_ref = request.args.get('data')
    
    try:
        data = DashboardService.get_dashboard_data(data_ref)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500