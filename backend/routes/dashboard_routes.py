from flask import Blueprint, jsonify, request
from backend.services.dashboard_service import get_dashboard_data, get_last_migration_time
import threading

dashboard_bp = Blueprint('dashboard', __name__)

CACHE = { "last_db_update": None, "cached_date": None, "payload": None }
CACHE_LOCK = threading.Lock()

@dashboard_bp.route('/dashboard', methods=['GET'])
@dashboard_bp.route('/atividades', methods=['GET'])
def list_atividades():
    try:
        requested_date = request.args.get('data')
        current_db_time = get_last_migration_time()

        # Cache Logic
        with CACHE_LOCK:
            cache_valido = (
                CACHE["payload"] is not None and 
                CACHE["last_db_update"] == current_db_time and
                current_db_time is not None
            )
            is_same_request = (requested_date == CACHE["cached_date"]) if requested_date else True

            if cache_valido and is_same_request:
                return jsonify(CACHE["payload"])

        # Monta filtro corretamente
        filters = {}
        if requested_date:
            filters["dateRange"] = { "start": requested_date, "end": requested_date }
        
        data = get_dashboard_data(filters)

        if data:
            with CACHE_LOCK:
                CACHE["payload"] = data
                CACHE["last_db_update"] = current_db_time
                CACHE["cached_date"] = requested_date
        
        return jsonify(data)

    except Exception as e:
        print(f"Erro Dash Route: {e}")
        return jsonify([]), 200 

@dashboard_bp.route('/last-update', methods=['GET'])
def get_last_update():
    try:
        dt = get_last_migration_time()
        return jsonify({"last_updated_at": dt}), 200
    except:
        return jsonify({"last_updated_at": None}), 200