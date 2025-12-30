const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Adicionamos o terceiro argumento 'options'
export const fetchAPI = async (endpoint, params = {}, options = {}) => {
  const url = new URL(`${API_URL}${endpoint}`);
  
  // Adiciona parâmetros de busca (query params)
  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.append(key, params[key]);
  });

  // Repassa 'options' (onde vem o signal) para o fetch nativo
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`Erro na API (${response.status}): ${response.statusText}`);
  }
  
  return response.json();
};