import apiClient from '../apiClient';

export const listVendorPayments = async (token, vendorId) => {
  const { data } = await apiClient.get(`/payments?vendorId=${vendorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const vendorPaymentReceipt = async (token, paymentId, receiptReference = '') => {
  const { data } = await apiClient.put(`/payments/${paymentId}/receipt`, {
    receiptReference: receiptReference || null
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
