import apiClient from '../apiClient';

export const listPayments = async (token) => {
  const { data } = await apiClient.get('/payments', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const createPayment = async (token, payload) => {
  const { data } = await apiClient.post('/payments', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const completePayment = async (token, id) => {
  const { data } = await apiClient.put(`/payments/${id}/complete`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const failPayment = async (token, id) => {
  const { data } = await apiClient.put(`/payments/${id}/fail`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
