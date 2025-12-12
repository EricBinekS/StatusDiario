import { fetchAPI } from './api';

export const getDashboardData = async () => {
  // Retorna a lista plana de atividades
  return await fetchAPI('/atividades');
};