import { fetchAPI } from './api';

export const getOverviewData = async (viewMode = 'semana') => {
  return await fetchAPI('/overview', { view: viewMode });
};