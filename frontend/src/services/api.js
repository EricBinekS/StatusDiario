// frontend/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const fetchAPI = async (endpoint, params = {}, options = {}) => {
  const url = new URL(`${API_URL}${endpoint}`);
  
  // Limpa params undefined/null e adiciona à URL
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorMessage = await response.text().catch(() => response.statusText);
    throw new Error(`API Error ${response.status}: ${errorMessage}`);
  }
  
  return response.json();
};