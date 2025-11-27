import pandas as pd
import datetime
import re

def flexible_time_to_datetime(value):
    """Função flexível que converte múltiplos formatos de hora para um objeto datetime."""
    if pd.isna(value): return None
    if isinstance(value, (int, float)):
        if value < 0: return None
        try: return pd.to_datetime('1899-12-30') + pd.to_timedelta(value, 'D')
        except: return None
    if isinstance(value, datetime.time):
        # A conversão de datetime.time para datetime.datetime é feita com pd.to_datetime para manter compatibilidade
        return pd.to_datetime(value.strftime('%H:%M:%S'))
    if isinstance(value, str):
        try: return pd.to_datetime(value)
        except (ValueError, TypeError): return None
    return None

def clean_column_names(columns):
    """Limpa e garante que os nomes de coluna sejam únicos."""
    new_columns, counts = [], {}
    for col in columns:
        if pd.isna(col): col = 'Unnamed'
        # Remove caracteres especiais e acentos, mantém minúsculas e remove espaços. (Corrigido da versão anterior)
        clean_col = re.sub(r'[^\w\s]+', '', str(col).strip().lower())
        clean_col = re.sub(r'\s+', '_', clean_col) 
    
        if clean_col in counts:
            counts[clean_col] += 1
            new_columns.append(f"{clean_col}_{counts[clean_col]}")
        else:
            counts[clean_col] = 0
            new_columns.append(clean_col)
    return new_columns

def format_timedelta_to_hhmm(td):
    if pd.isna(td):
        return None
    if not isinstance(td, pd.Timedelta):
        try:
            td = pd.to_timedelta(td, unit='s' if isinstance(td, (int, float)) else None)
        except (ValueError, TypeError):
            return None
    if pd.isna(td):
        return None
    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    return f"{hours:02d}:{minutes:02d}"

def normalize_str(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    return str(v).strip().upper()