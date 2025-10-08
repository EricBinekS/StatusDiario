import pandas as pd
import glob
import json
import os
import re
import datetime
from pathlib import Path

def flexible_time_to_datetime(value):
    if pd.isna(value): return None
    if isinstance(value, (int, float)):
        if value < 0: return None
        try: return pd.to_datetime('1899-12-30') + pd.to_timedelta(value, 'D')
        except: return None
    if isinstance(value, datetime.time):
        return pd.to_datetime(value.strftime('%H:%M:%S'))
    if isinstance(value, str):
        try: return pd.to_datetime(value)
        except (ValueError, TypeError): return None
    return None

def clean_column_names(columns):
    new_columns, counts = [], {}
    for col in columns:
        if pd.isna(col): col = 'Unnamed'
        clean_col = re.sub(r'[\*\.\-]', '', str(col).strip())
        clean_col = re.sub(r'\s+', ' ', clean_col)
        if clean_col in counts:
            counts[clean_col] += 1
            new_columns.append(f"{clean_col}_{counts[clean_col]}")
        else:
            counts[clean_col] = 0
            new_columns.append(clean_col)
    return new_columns

class PainelDataPipeline:
    def __init__(self, raw_data_path, map_path, output_path):
        self.raw_data_path = raw_data_path
        self.map_path = map_path
        self.output_path = output_path
        self.df = None

    def _load_json_config(self):
        print(f"Carregando arquivo de configuração: {self.map_path}")
        try:
            with open(self.map_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"ERRO: Arquivo de mapeamento não encontrado em {self.map_path}")
            return None

    def _read_and_combine_data(self, mapa_de_abas):
        file_paths = glob.glob(self.raw_data_path)
        if not file_paths:
            print("AVISO: Nenhum arquivo Excel encontrado.")
            return False
        df_list = []
        for f_path in file_paths:
            nome_do_arquivo = os.path.basename(f_path)
            nome_da_aba = mapa_de_abas.get(nome_do_arquivo)
            if nome_da_aba:
                print(f"Lendo arquivo '{nome_do_arquivo}' na aba '{nome_da_aba}'...")
                temp_df = pd.read_excel(f_path, sheet_name=nome_da_aba, header=None, engine='openpyxl')
                header_row = temp_df.iloc[4]
                df_data = temp_df[5:].copy()
                df_data.columns = clean_column_names(header_row)
                print(f"--- Colunas encontradas em '{nome_do_arquivo}': {list(df_data.columns)}")
                df_data.dropna(subset=['ATIVO'], inplace=True)
                df_list.append(df_data)
        if not df_list:
            print("Nenhum dado foi carregado dos arquivos Excel.")
            return False
        self.df = pd.concat(df_list, ignore_index=True)
        print(f"{len(self.df)} linhas de dados carregadas.")
        return True

    def _transform_data(self):
        if self.df is None or self.df.empty: return
        self.df = self.df.where(pd.notnull(self.df), None)
        
        rename_map = {
            'ATIVO': 'ATIVO', 'Atividade': 'Atividade', 'Inicia': 'Inicia', 
            'HR Turma Pronta': 'HR Turma Pronta', 'Duração': 'Duração', 'SB': 'SB', 'SUB': 'SUB',
            'SB_4': 'SB_4', 'Quantidade': 'Quantidade', 'Quantidade_11': 'Quantidade_1', 
            'Fim': 'Fim', 'Fim_8': 'Fim_8', 'Fim_10': 'Fim_10', 'DATA': 'DATA',
            'Prévia 1': 'Prévia - 1', 'Prévia 2': 'Prévia - 2', 
            'Gerência da Via': 'Gerência da Via', 'Trecho': 'Trecho', 
            'Programar para D+1': 'Programar para D+1', 'Coordenação da Via': 'Coordenação da Via'
        }
        self.df.rename(columns=rename_map, inplace=True)

        for col in rename_map.values():
            if col not in self.df.columns:
                self.df[col] = None
                
        self.df['DATA'] = pd.to_datetime(self.df['DATA'], errors='coerce').dt.strftime('%Y-%m-%d')
        
        self.df['start_prog_dt'] = self.df.apply(self._create_full_datetime, args=('Inicia',), axis=1)
        self.df['start_real_dt'] = self.df.apply(self._create_full_datetime, args=('HR Turma Pronta',), axis=1)
        self.df['duration_dt'] = self.df.apply(lambda row: flexible_time_to_datetime(row['Duração']), axis=1)
        
        end_time_cols = ['Fim', 'Fim_8', 'Fim_10']
        self.df['end_real_dt'] = self.df.apply(lambda row: next((self._create_full_datetime(row, col) for col in end_time_cols if row.get(col)), None), axis=1)
        
        self.df['inicio_prog'] = self.df['start_prog_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)
        self.df['inicio_real'] = self.df['start_real_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)
        self.df['tempo_prog'] = self.df['duration_dt'].apply(lambda dt: dt.strftime('%H:%M') if pd.notna(dt) else None)
        
        self.df['timer_start_timestamp'] = self.df['start_real_dt'].apply(lambda dt: dt.isoformat() if pd.notna(dt) else None)
        self.df['timer_end_timestamp'] = self.df['end_real_dt'].apply(lambda dt: dt.isoformat() if pd.notna(dt) else None)

        self.df['local_prog'] = self.df['SB']
        self.df['local_real'] = self.df['SB_4']
        self.df['quantidade_prog'] = self.df['Quantidade']
        self.df['quantidade_real'] = self.df['Quantidade_1']
        self.df['detalhamento'] = self.df.apply(lambda row: row.get('Prévia - 2') if pd.notna(row.get('end_real_dt')) else row.get('Prévia - 1'), axis=1)

    def _save_to_json(self):
        final_columns = [
            'Gerência da Via', 'Coordenação da Via', 'Trecho', 'SUB', 'ATIVO', 'Atividade', 
            'Programar para D+1', 'DATA', 'inicio_prog', 'inicio_real', 'tempo_prog',
            'local_prog', 'local_real', 'quantidade_prog', 'quantidade_real',
            'detalhamento', 'timer_start_timestamp', 'timer_end_timestamp'
        ]
        
        df_final = self.df[[col for col in final_columns if col in self.df.columns]].copy()
        df_final = df_final.where(pd.notnull(df_final), None)
        result_list = df_final.to_dict(orient='records')
        
        print(f"Verificando... Salvando JSON em: {Path(self.output_path).resolve()}")
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)
        with open(self.output_path, 'w', encoding='utf-8') as f:
            json.dump(result_list, f, ensure_ascii=False, indent=2)
        print(f"Arquivo '{self.output_path}' gerado com sucesso.")

    def _create_full_datetime(self, row, time_col_name):
        date_str = row.get('DATA')
        time_val = row.get(time_col_name)
        if pd.isna(date_str) or pd.isna(time_val): return None
        time_dt = flexible_time_to_datetime(time_val)
        if not time_dt: return None
        try:
            full_dt = datetime.datetime.combine(pd.to_datetime(date_str).date(), time_dt.time())
            return pd.to_datetime(full_dt).tz_localize('America/Sao_Paulo')
        except Exception:
            return None

    def run(self):
        mapa_de_abas = self._load_json_config()
        if not mapa_de_abas: return
        if self._read_and_combine_data(mapa_de_abas):
            self._transform_data()
            self._save_to_json()

if __name__ == "__main__":
    try:
        SCRIPT_DIR = Path(__file__).parent
        PROJECT_ROOT = SCRIPT_DIR.parent.parent
        pipeline = PainelDataPipeline(
            raw_data_path=str(PROJECT_ROOT / "backend" / "raw_data" / "*.xlsx"),
            map_path=str(PROJECT_ROOT / "backend" / "scripts" / "mapeamento_abas.json"),
            output_path=str(PROJECT_ROOT / "frontend" / "public" / "data.json")
        )
        pipeline.run()
    except Exception as e:
        print(f"ERRO CRÍTICO no fluxo principal: {e}")