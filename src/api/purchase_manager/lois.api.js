import apiClient from '../apiClient';

export const listLois = async (token) => {
  const { data } = await apiClient.get('/lois', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const createLoi = async (token, payload) => {
  console.log('LOI API - createLoi called with:', { payload, endpoint: '/lois' });
  const { data } = await apiClient.post('/lois', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('LOI API - Response:', data);
  return data;
};

export const updateLoi = async (token, id, payload) => {
  const { data } = await apiClient.patch(`/lois/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const resubmitLoi = async (token, id) => {
  const { data } = await apiClient.patch(`/lois/${id}`, { status: 'sent' }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const deleteLoi = async (token, id) => {
  const { data } = await apiClient.delete(`/lois/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
