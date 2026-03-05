import apiClient from '../apiClient';

export const listVendorCounterQuotations = async (token, vendorId) => {
  const { data } = await apiClient.get(`/counter-quotations?vendorId=${vendorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const respondToCounterQuotation = async (token, counterId, payload) => {
  const { data } = await apiClient.patch(`/counter-quotation/${counterId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
