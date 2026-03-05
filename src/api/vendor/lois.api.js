import apiClient from '../apiClient';

export const listVendorLois = async (token, vendorId) => {
  const { data } = await apiClient.get(`/lois?vendorId=${vendorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const vendorLoiAction = async (token, loiId, action) => {
  const { data } = await apiClient.put(`/vendor/loi/${loiId}/${action}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
