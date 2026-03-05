import apiClient from '../apiClient';

export const listVendorInvoices = async (token, vendorId) => {
  const { data } = await apiClient.get(`/invoices?vendorId=${vendorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const createVendorInvoice = async (token, payload) => {
  const { data } = await apiClient.post('/invoices', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const getVendorInvoice = async (token, invoiceId) => {
  const { data } = await apiClient.get(`/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const getVendorInvoiceSummary = async (token, invoiceId) => {
  const { data } = await apiClient.get(`/invoices/${invoiceId}/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const markVendorInvoiceReceived = async (token, invoiceId) => {
  const { data } = await apiClient.patch(`/invoices/${invoiceId}/received`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const acceptVendorInvoice = async (token, invoiceId) => {
  const { data } = await apiClient.patch(`/invoices/${invoiceId}/accept`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const rejectVendorInvoice = async (token, invoiceId) => {
  const { data } = await apiClient.patch(`/invoices/${invoiceId}/reject`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const markVendorInvoicePaid = async (token, invoiceId) => {
  const { data } = await apiClient.patch(`/invoices/${invoiceId}/paid`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
