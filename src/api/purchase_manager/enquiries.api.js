import apiClient from '../apiClient';

export const listEnquiries = async (token) => {
  const { data } = await apiClient.get('/purchase-enquiries', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const createEnquiry = async (token, payload) => {
  const { data } = await apiClient.post('/purchase-enquiry', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const updateEnquiry = async (token, id, payload) => {
  const { data } = await apiClient.patch(`/purchase-enquiry/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const deleteEnquiry = async (token, id) => {
  const { data } = await apiClient.delete(`/purchase-enquiry/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const rejectEnquiry = async (token, id, payload = {}) => {
  const { data } = await apiClient.patch(`/purchase-enquiry/${id}/reject`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
