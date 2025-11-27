import { apiRequest } from './apiClient'

export function fetchAdminDashboard(token) {
  return apiRequest('/api/admin/dashboard', { method: 'GET', token })
}

export function fetchAdminDrivers(token, params = '') {
  const query = params ? `?${params}` : ''
  return apiRequest(`/api/admin/drivers${query}`, { method: 'GET', token })
}

export function updateDriverStatus(token, driverId, status) {
  return apiRequest(`/api/admin/drivers/${driverId}/status`, {
    method: 'POST',
    token,
    body: { status },
  })
}

export function fetchAdminRides(token) {
  return apiRequest('/api/admin/rides', { method: 'GET', token })
}

