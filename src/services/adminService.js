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

// Note: Backend endpoint /api/admin/feedbacks doesn't exist yet
// Feedbacks are currently extracted from rides data in PassengerFeedbacks component
// When backend adds /api/admin/feedbacks endpoint, uncomment and use this function:
// export function fetchAdminFeedbacks(token) {
//   return apiRequest('/api/admin/feedbacks', { method: 'GET', token })
// }

// Note: Backend endpoint /api/admin/passengers doesn't exist yet
// Passengers are currently extracted from rides data in AdminDashboard component
// When backend adds /api/admin/passengers endpoint, uncomment and use this function:
// export function fetchAdminPassengers(token) {
//   return apiRequest('/api/admin/passengers', { method: 'GET', token })
// }

