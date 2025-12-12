const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const fetchAPI = async (endpoint, params = {}) => {
  const url = new URL(`${API_URL}${endpoint}`);
  
  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.append(key, params[key]);
  });

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Erro na API (${response.status}): ${response.statusText}`);
  }
  
  return response.json();
};