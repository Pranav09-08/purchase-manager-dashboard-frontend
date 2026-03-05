import apiClient from '../apiClient';

export const listRegistrations = async (token) => {
  const { data } = await apiClient.get('/auth/registrations', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const getRegistration = async (token, registrationId) => {
  const { data } = await apiClient.get(`/auth/registrations/${registrationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const approveRegistration = async (token, registrationId) => {
  const { data } = await apiClient.put(`/auth/registrations/${registrationId}/approve`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const rejectRegistration = async (token, registrationId) => {
  const { data } = await apiClient.put(`/auth/registrations/${registrationId}/reject`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const updateCertificateStatus = async (token, registrationId, status) => {
  const { data } = await apiClient.put(`/auth/registrations/${registrationId}/certificate`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
