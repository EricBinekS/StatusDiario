from flask import Blueprint, jsonify, request
from backend.services.overview_service import get_overview_data
from backend.services.dashboard_service import get_last_migration_time
import threading

overview_bp = Blueprint('overview', __name__)

# CACHE para Overview (separado por view_mode: 'semana' ou 'mes')
CACHE = {
    "last_db_update": None,
    "semana": None,
    "mes": None
}
CACHE_LOCK = threading.Lock()

@overview_bp.route('/overview', methods=['GET'])
def get_overview():
    try:
        view_mode = request.args.get('view', 'semana') 
        
        # 1. Verifica se o banco mudou
        meta = get_last_migration_time()
        current_db_time = meta.get("last_updated_at")

        # 2. Tenta pegar do Cache
        with CACHE_LOCK:
            if (CACHE["last_db_update"] == current_db_time and 
                CACHE.get(view_mode) is not None):
                print(f"⚡ Cache Hit Overview ({view_mode})")
                return jsonify(CACHE[view_mode])

        # 3. Se não tem cache ou banco mudou, processa (agora SEM PANDAS, leve!)
        print(f"🔄 Processando Overview ({view_mode})...")
        data = get_overview_data(view_mode)
        
        # 4. Salva no Cache
        with CACHE_LOCK:
            CACHE[view_mode] = data
            CACHE["last_db_update"] = current_db_time # Sincroniza versão
            
            # Limpa o outro modo se o banco mudou, para forçar refresh quando necessário
            other_mode = 'mes' if view_mode == 'semana' else 'semana'
            if CACHE["last_db_update"] != current_db_time:
                 CACHE[other_mode] = None

        return jsonify(data)

    except Exception as e:
        print(f"Erro na Rota Overview: {e}")
        return jsonify([]), 200