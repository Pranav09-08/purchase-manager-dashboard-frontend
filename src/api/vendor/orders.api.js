import apiClient from '../apiClient';

// Vendor Orders API
const vendorOrdersApi = {
  list: (token, vendorId) => apiClient.get(`/purchase-orders?vendorId=${vendorId}`, { headers: { Authorization: `Bearer ${token}` } }),
  getById: (token, id) => apiClient.get(`/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  create: (token, data) => apiClient.post('/orders', data, { headers: { Authorization: `Bearer ${token}` } }),
  update: (token, id, data) => apiClient.put(`/orders/${id}`, data, { headers: { Authorization: `Bearer ${token}` } }),
  confirm: (token, id) => apiClient.put(`/orders/${id}/confirm`, {}, { headers: { Authorization: `Bearer ${token}` } }),
  // Add more vendor order endpoints as needed
};

export const listVendorOrders = async (token, vendorId) => {
  const { data } = await vendorOrdersApi.list(token, vendorId);
  return data;
};

export const confirmVendorOrder = async (token, orderId) => {
  const { data } = await vendorOrdersApi.confirm(token, orderId);
  return data;
};

export const getVendorOrder = async (token, orderId) => {
  const { data } = await vendorOrdersApi.getById(token, orderId);
  return data;
};

export default vendorOrdersApi;
