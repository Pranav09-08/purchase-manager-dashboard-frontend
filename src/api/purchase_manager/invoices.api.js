import apiClient from '../apiClient';

export const listInvoices = async (token) => {
  const { data } = await apiClient.get('/invoices', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const markInvoiceReceived = async (token, id) => {
  const { data } = await apiClient.patch(`/invoices/${id}/received`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const acceptInvoice = async (token, id) => {
  const { data } = await apiClient.patch(`/invoices/${id}/accept`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const rejectInvoice = async (token, id, payload = {}) => {
  const { data } = await apiClient.patch(`/invoices/${id}/reject`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const markInvoicePaid = async (token, id) => {
  const { data } = await apiClient.patch(`/invoices/${id}/paid`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

// Legacy: Keep for backward compatibility
export const invoiceAction = async (token, id, action, payload = {}) => {
  const actionMap = {
    'receive': 'received',
    'accept': 'accept',
    'reject': 'reject',
    'paid': 'paid',
  };
  const path = actionMap[action] || action;
  const { data } = await apiClient.patch(`/invoices/${id}/${path}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

