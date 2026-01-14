from flask import Blueprint, jsonify, request
from backend.services.overview_service import get_overview_kpis
from datetime import datetime, timedelta

overview_bp = Blueprint('overview', __name__)

def get_date_range(view_mode):
    """
    Helper para converter 'view' (string) em datas de início e fim.
    """
    today = datetime.now().date()
    if view_mode == 'hoje':
        return today, today
    elif view_mode == 'semana':
        return today - timedelta(days=7), today
        
    elif view_mode == 'mes':
        start = today.replace(day=1)
        return start, today
    return today - timedelta(days=7), today
@overview_bp.route('/overview', methods=['GET'])

def overview():
    try:
        view_mode = request.args.get('view', 'semana')
        gerencia = request.args.get('gerencia')
        tipo = request.args.get('tipo')
        start_date, end_date = get_date_range(view_mode)
        filters = {
            'dateRange': {
                'start': start_date.strftime('%Y-%m-%d'),
                'end': end_date.strftime('%Y-%m-%d')
            }
        }
        if gerencia:
            filters['gerencia'] = [gerencia]
        if tipo:
            filters['tipo'] = tipo
        data = get_overview_kpis(filters)
        return jsonify(data)
    except Exception as e:
        print(f"❌ Erro Overview Route: {e}")
        return jsonify({}), 500