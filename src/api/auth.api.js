
import apiClient from './apiClient';

// Unified Auth API for both Purchase Manager and Vendor
const authApi = {
  // Unified login for both vendors and purchase managers
  login: (credentials) => apiClient.post('/auth/login', credentials),
  // Register vendor
  register: (payload) => apiClient.post('/auth/register', payload),
  // Logout (token required)
  logout: (token) => apiClient.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } }),
  // Get own vendor profile (token required)
  getOwnVendorProfile: (token) => apiClient.get('/vendor/profile', { headers: { Authorization: `Bearer ${token}` } }),
  // Get vendor profile by ID (token required)
  getVendorProfile: (vendorId, token) => apiClient.get(`/vendor/profile/${vendorId}`, { headers: { Authorization: `Bearer ${token}` } }),
  // Update vendor profile by ID (token required)
  updateVendorProfileById: (vendorId, data, token) => apiClient.put(`/vendor/profile/${vendorId}`, data, { headers: { Authorization: `Bearer ${token}` } }),
  // Update own vendor profile (token required)
  updateOwnVendorProfile: (data, token) => apiClient.put('/vendor/profile', data, { headers: { Authorization: `Bearer ${token}` } }),
  // Get all registration requests (purchase manager, token required)
  listRegistrations: (token) => apiClient.get('/auth/registrations', { headers: { Authorization: `Bearer ${token}` } }),
  // Get registration request by ID (purchase manager, token required)
  getRegistration: (token, id) => apiClient.get(`/auth/registrations/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  // Approve registration (purchase manager, token required)
  approveRegistration: (token, id) => apiClient.put(`/auth/registrations/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } }),
  // Reject registration (purchase manager, token required)
  rejectRegistration: (token, id, reason) => apiClient.put(`/auth/registrations/${id}/reject`, { reason }, { headers: { Authorization: `Bearer ${token}` } }),
  // Update certificate status (purchase manager, token required)
  updateCertificateStatus: (id, data, token) => apiClient.put(`/auth/registrations/${id}/certificate`, data, { headers: { Authorization: `Bearer ${token}` } }),
};

export default authApi;
