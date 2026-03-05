import apiClient from '../apiClient';

export const listOrders = async (token) => {
  const { data } = await apiClient.get('/purchase-orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const createOrder = async (token, payload) => {
  const { data } = await apiClient.post('/orders', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
