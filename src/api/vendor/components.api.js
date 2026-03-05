import apiClient from '../apiClient';

export const listVendorComponents = async (token) => {
  const { data } = await apiClient.get('/vendor/components', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const getVendorComponent = async (token, componentId) => {
  const { data } = await apiClient.get(`/vendor/components/${componentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const createVendorComponent = async (token, payload) => {
  const { data } = await apiClient.post('/vendor/components', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const updateVendorComponent = async (token, componentId, payload) => {
  const { data } = await apiClient.put(`/vendor/components/${componentId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const deleteVendorComponent = async (token, componentId) => {
  const { data } = await apiClient.delete(`/vendor/components/${componentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const approveVendorComponent = async (token, componentId) => {
  const { data } = await apiClient.put(`/vendor/components/${componentId}/approve`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const listAllComponents = async (token) => {
  const { data } = await apiClient.get('/components', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const rejectVendorComponent = async (token, componentId) => {
  const { data } = await apiClient.put(`/vendor/components/${componentId}/reject`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const listRequiredVendorComponents = async (token) => {
  const { data } = await apiClient.get('/vendor/components-required', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const listAvailableVendorComponents = async (token) => {
  const { data } = await apiClient.get('/vendor/available-components', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const addAvailableVendorComponent = async (token, payload) => {
  const { data } = await apiClient.post('/vendor/add-available-component', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
