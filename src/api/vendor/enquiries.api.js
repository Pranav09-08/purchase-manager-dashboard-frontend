import apiClient from '../apiClient';

export const listVendorEnquiries = async (token, vendorId) => {
  const query = vendorId ? `?vendorId=${encodeURIComponent(vendorId)}` : '';
  const { data } = await apiClient.get(`/purchase-enquiries${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
