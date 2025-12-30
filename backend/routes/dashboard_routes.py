from flask import Blueprint, jsonify, request
from backend.services.dashboard_service import get_dashboard_data, get_last_migration_time
import threading
from datetime import datetime

dashboard_bp = Blueprint('dashboard', __name__)

# --- CACHE APERFEIÇOADO ---
# Agora guardamos também a DATA dos dados cacheados.
CACHE = {
    "last_db_update": None, # Timestamp da última migração no banco
    "cached_date": None,    # Qual data (dia) está guardada no payload
    "payload": None         # Os dados em si
}
CACHE_LOCK = threading.Lock()

@dashboard_bp.route('/dashboard', methods=['GET'])
@dashboard_bp.route('/atividades', methods=['GET'])
def list_atividades():
    try:
        # Pega a data solicitada pelo Frontend (ex: '2025-12-30')
        requested_date = request.args.get('data')
        
        # Se não veio data, assumimos "hoje" ou deixamos o service decidir (None)
        # Mas para o cache funcionar bem com o front mandando data, vamos focar no requested_date.
        
        # 1. Verifica Timestamp Atual do Banco (Consulta ultra-leve)
        meta = get_last_migration_time()
        current_db_time = meta.get("last_updated_at")

        # 2. TENTA USAR O CACHE
        with CACHE_LOCK:
            # Condições para Cache Hit:
            # a) Temos dados em memória
            # b) O banco não foi atualizado desde a última vez
            # c) A data que o usuário pediu É A MESMA que temos guardada
            cache_valido = (
                CACHE["payload"] is not None and 
                CACHE["last_db_update"] == current_db_time
            )
            
            same_date_request = False
            if requested_date:
                # Se o usuário pediu uma data, tem que ser igual a do cache
                if CACHE["cached_date"] == requested_date:
                    same_date_request = True
            else:
                # Se o usuário não pediu data, serve o que tiver (cache padrão)
                same_date_request = True

            if cache_valido and same_date_request:
                print(f"⚡ Cache Hit: Servindo dados de {CACHE['cached_date']} da memória.")
                return jsonify(CACHE["payload"])

        # 3. Cache Miss: Busca no Banco
        print(f"🔄 Cache Miss: Buscando dados para {requested_date or 'Padrão'}...")
        
        filters = {"data": requested_date} if requested_date else None
        data = get_dashboard_data(filters)

        # 4. Atualiza o Cache (apenas se tiver dados retornados)
        # Se veio vazio (erro ou dia sem dados), evitamos cachear para não travar em vazio.
        if data:
            with CACHE_LOCK:
                CACHE["payload"] = data
                CACHE["last_db_update"] = current_db_time
                # Se o filtro foi None, precisamos descobrir qual data o service pegou.
                # Mas simplificando: se veio requested_date, salvamos ele.
                if requested_date:
                    CACHE["cached_date"] = requested_date
                else:
                    # Tenta extrair a data do primeiro item para saber o que cacheamos
                    try:
                        # Formato esperado do service: dd/mm
                        # Isso é apenas informativo para o próximo hit
                        # Se não tiver requested_date, o cache fica genérico.
                        pass 
                    except:
                        pass
        
        return jsonify(data)

    except Exception as e:
        print(f"Erro na Rota Dashboard: {e}")
        return jsonify([]), 200 

@dashboard_bp.route('/last-update', methods=['GET'])
def get_last_update():
    try:
        data = get_last_migration_time()
        return jsonify(data), 200
    except Exception as e:
        print(f"Erro na Rota Last Update: {e}")
        return jsonify({"last_updated_at": None}), 200