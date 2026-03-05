import apiClient from '../apiClient';

export const getAnalytics = async (token) => {
  const { data } = await apiClient.get('/analytics/purchase-manager', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
