from flask import Blueprint, jsonify, request
# Importa o serviço que já tratamos (ele usa get_db_engine internamente)
from services.overview_service import get_overview_data

overview_bp = Blueprint('overview', __name__)

@overview_bp.route('/overview', methods=['GET'])
def get_overview():
    try:
        # Pega parâmetros da URL (Query Params)
        view_mode = request.args.get('view', 'semana') # default: semana
        start_date = request.args.get('start')
        end_date = request.args.get('end')

        # Chama o serviço
        data = get_overview_data(start_date, end_date, view_mode)
        
        # BLINDAGEM NO BACKEND:
        # Garante que sempre retorne uma lista, mesmo se for None
        if data is None:
            data = []
            
        return jsonify(data)

    except Exception as e:
        print(f"Erro Crítico na Rota Overview: {e}")
        # Retorna lista vazia em vez de erro 500, para a tela ficar "Sem dados" em vez de crashar
        return jsonify([])