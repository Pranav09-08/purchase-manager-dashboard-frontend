import apiClient from '../apiClient';

export const activateComponent = async (token, componentId, active = true) => {
  const { data } = await apiClient.put(`/components/${componentId}/active`, { active }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const listAllVendorComponents = async (token) => {
  const { data } = await apiClient.get('/purchase-manager/vendor-components', {
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

export const listProductComponents = async (token, productId) => {
  const { data } = await apiClient.get(`/products/${productId}/components`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const listComponentVendors = async (token, { componentCode, componentName }) => {
  const query = componentName
    ? `?componentName=${encodeURIComponent(componentName)}`
    : '';
  const resolvedCode = componentCode || 'unknown';

  const { data } = await apiClient.get(`/components/${resolvedCode}/vendors${query}`, {
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

export const rejectVendorComponent = async (token, componentId, rejectionReason) => {
  const { data } = await apiClient.put(`/vendor/components/${componentId}/reject`, {
    rejectionReason: rejectionReason || 'Rejected by purchase manager',
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
