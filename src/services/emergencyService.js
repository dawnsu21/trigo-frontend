import { apiRequest } from './apiClient'

/**
 * Report an emergency
 * @param {string} token - Authentication token
 * @param {Object} payload - Emergency data
 * @param {number} payload.ride_id - Optional: Related ride ID
 * @param {string} payload.type - Emergency type: "safety_concern" | "driver_emergency" | "passenger_emergency" | "accident" | "other"
 * @param {string} payload.title - Emergency title
 * @param {string} payload.description - Emergency description
 * @param {number} payload.latitude - Optional: Latitude
 * @param {number} payload.longitude - Optional: Longitude
 * @returns {Promise}
 */
export function reportEmergency(token, payload) {
  return apiRequest('/api/emergencies', {
    method: 'POST',
    token,
    body: payload,
  })
}

/**
 * Admin: Get all emergencies
 * @param {string} token - Authentication token
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status: "pending" | "acknowledged" | "resolved"
 * @param {string} filters.type - Filter by type
 * @returns {Promise}
 */
export function fetchEmergencies(token, filters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.type) params.append('type', filters.type)
  
  const queryString = params.toString()
  const url = `/api/admin/emergencies${queryString ? `?${queryString}` : ''}`
  
  return apiRequest(url, {
    method: 'GET',
    token,
  })
}

/**
 * Admin: Acknowledge an emergency
 * @param {string} token - Authentication token
 * @param {number} emergencyId - Emergency ID
 * @param {string} adminNotes - Optional admin notes
 * @returns {Promise}
 */
export function acknowledgeEmergency(token, emergencyId, adminNotes = '') {
  return apiRequest(`/api/admin/emergencies/${emergencyId}/acknowledge`, {
    method: 'POST',
    token,
    body: { admin_notes: adminNotes },
  })
}

/**
 * Admin: Resolve an emergency
 * @param {string} token - Authentication token
 * @param {number} emergencyId - Emergency ID
 * @param {string} adminNotes - Optional admin notes
 * @returns {Promise}
 */
export function resolveEmergency(token, emergencyId, adminNotes = '') {
  return apiRequest(`/api/admin/emergencies/${emergencyId}/resolve`, {
    method: 'POST',
    token,
    body: { admin_notes: adminNotes },
  })
}

