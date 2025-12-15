import { fetchAPI } from './api';

export const getDashboardData = async (date) => {
  return await fetchAPI('/dashboard', { data: date });
};