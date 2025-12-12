import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy import text
from db.database import db

def get_overview_data(view_mode='semana', start_date=None, end_date=None):
    """
    Gera dados para o dashboard gerencial.
    view_mode: 'semana' (Dom-Sáb atual) ou 'mes' (1 até fim do mês atual).
    """
    today = datetime.now().date()

    # 1. Definição das Datas (Regra de Negócio 1 e 4)
    if start_date and end_date:
        # Se vier manual do filtro (caso implemente datepicker manual futuramente)
        data_inicio = pd.to_datetime(start_date).date()
        data_fim = pd.to_datetime(end_date).date()
    else:
        if view_mode == 'mes':
            # Do dia 1 até o último dia do mês atual
            data_inicio = today.replace(day=1)
            proximo_mes = data_inicio.replace(day=28) + timedelta(days=4)
            data_fim = proximo_mes - timedelta(days=proximo_mes.day)
        else:
            # Semana: Domingo anterior (ou hoje) até o próximo Sábado
            # weekday(): Seg=0, Dom=6.
            # Se hoje é Dom(6), subtrai 0. Se é Seg(0), subtrai 1.
            idx_semana = (today.weekday() + 1) % 7
            data_inicio = today - timedelta(days=idx_semana)
            data_fim = data_inicio + timedelta(days=6)

    # Converter para string para query SQL
    str_inicio = data_inicio.strftime('%Y-%m-%d')
    str_fim = data_fim.strftime('%Y-%m-%d')

    # 2. Query Base
    query = text("""
        SELECT 
            atividade,
            gerencia,
            inicio_prog,
            fim_prog,
            inicio_real,
            fim_real,
            status,
            ativo
        FROMtb_atividades
        WHERE 
            inicio_prog::date >= :inicio AND inicio_prog::date <= :fim
    """)
    
    try:
        df = pd.read_sql(query, db.engine, params={"inicio": str_inicio, "fim": str_fim})
        
        if df.empty:
            return {
                "cards": [],
                "aderencia_global": 0,
                "total_horas_prog": 0,
                "total_horas_real": 0,
                "periodo": f"{data_inicio.strftime('%d/%m')} a {data_fim.strftime('%d/%m')}"
            }

        # Converter colunas de data
        df['inicio_prog'] = pd.to_datetime(df['inicio_prog'])
        df['fim_prog'] = pd.to_datetime(df['fim_prog'])
        df['inicio_real'] = pd.to_datetime(df['inicio_real'])
        df['fim_real'] = pd.to_datetime(df['fim_real'])

        # 3. Cálculo de Horas (Regra de Negócio 3)
        # Calcula duração em horas (total_seconds / 3600)
        df['horas_prog'] = (df['fim_prog'] - df['inicio_prog']).dt.total_seconds() / 3600
        
        # Para horas reais, consideramos apenas se tiver status concluído ou data preenchida
        # Se inicio_real ou fim_real for NaT, assume 0
        df['horas_real'] = (df['fim_real'] - df['inicio_real']).dt.total_seconds() / 3600
        df['horas_real'] = df['horas_real'].fillna(0)

        # Regra B: Mecanização (Separação visual)
        ATIVIDADES_MECANIZACAO = [
            "SOCADORA", "REGULADORA", "ESMERILHADORA", "DESGUARNECEDORA", "ESTABILIZADORA"
        ]
        
        # Filtra mecanização
        mask_mecanizacao = df['atividade'].str.upper().apply(
            lambda x: any(m in str(x).upper() for m in ATIVIDADES_MECANIZACAO)
        )
        
        df_mecanizacao = df[mask_mecanizacao].copy()
        df_geral = df[~mask_mecanizacao].copy()

        # Função auxiliar para agrupar dados
        def processar_grupo(dataframe, group_by_col):
            if dataframe.empty:
                return []
            
            # Agrupa e soma as horas
            agrupado = dataframe.groupby(group_by_col).agg({
                'horas_prog': 'sum',
                'horas_real': 'sum',
                'status': lambda x: (x == 'Concluído').sum() # Contagem de concluídos para referência
            }).reset_index()

            # Calcula aderência baseada em HORAS
            agrupado['aderencia'] = (agrupado['horas_real'] / agrupado['horas_prog'] * 100).fillna(0)
            # Trava em 100% visualmente se passar (opcional, mas recomendado para gráficos)
            # agrupado['aderencia'] = agrupado['aderencia'].clip(upper=100) 

            cards = []
            for _, row in agrupado.iterrows():
                cards.append({
                    "nome": row[group_by_col],
                    "horas_prog": round(row['horas_prog'], 2),
                    "horas_real": round(row['horas_real'], 2),
                    "aderencia": round(row['aderencia'], 1),
                    "total_atividades": int(row['status']) # opcional
                })
            return cards

        # Gera cards por Gerência (Dados Gerais)
        cards_gerencia = processar_grupo(df_geral, 'gerencia')
        
        # Gera card único ou detalhado para Mecanização (Agrupado por Atividade ou unificado)
        # Aqui vamos agrupar por Atividade para ver qual máquina rendeu mais
        cards_mecanizacao = processar_grupo(df_mecanizacao, 'atividade')

        # Totais Globais
        total_prog = df['horas_prog'].sum()
        total_real = df['horas_real'].sum()
        aderencia_global = (total_real / total_prog * 100) if total_prog > 0 else 0

        return {
            "cards_gerencia": cards_gerencia,
            "cards_mecanizacao": cards_mecanizacao,
            "aderencia_global": round(aderencia_global, 1),
            "total_horas_prog": round(total_prog, 2),
            "total_horas_real": round(total_real, 2),
            "periodo": f"{data_inicio.strftime('%d/%m')} a {data_fim.strftime('%d/%m')}",
            "debug_dates": f"{str_inicio} a {str_fim}"
        }

    except Exception as e:
        print(f"Erro no Overview Service: {e}")
        return {"error": str(e)}