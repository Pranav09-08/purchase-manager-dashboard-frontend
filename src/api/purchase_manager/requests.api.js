import apiClient from '../apiClient';

export const listRequests = async (token) => {
  const { data } = await apiClient.get('/requests', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
