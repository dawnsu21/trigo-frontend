import { apiRequest } from './apiClient'

export function fetchDriverProfile(token) {
  return apiRequest('/api/driver/profile', { method: 'GET', token })
}

export function updateDriverAvailability(token, payload) {
  return apiRequest('/api/driver/availability', {
    method: 'POST',
    token,
    body: payload,
  })
}

export function updateDriverLocation(token, payload) {
  return apiRequest('/api/driver/location', {
    method: 'POST',
    token,
    body: payload,
  })
}

export function fetchDriverQueue(token) {
  return apiRequest('/api/driver/rides/queue', { method: 'GET', token })
}

export function driverRideAction(token, rideId, action) {
  return apiRequest(`/api/driver/rides/${rideId}/${action}`, {
    method: 'POST',
    token,
  })
}

/**
 * Decline a ride request
 * @param {string} token - Authentication token
 * @param {number} rideId - Ride ID
 * @param {string} reason - Optional decline reason
 * @returns {Promise}
 */
export function declineRide(token, rideId, reason = '') {
  return apiRequest(`/api/driver/rides/${rideId}/decline`, {
    method: 'POST',
    token,
    body: reason ? { reason } : {},
  })
}

/**
 * Get driver trip history
 * @param {string} token - Authentication token
 * @param {number} page - Page number for pagination
 * @returns {Promise} Paginated ride history
 */
export function fetchDriverHistory(token, page = 1) {
  return apiRequest(`/api/driver/rides/history?page=${page}`, {
    method: 'GET',
    token,
  })
}

/**
 * Get passenger profile (for drivers who have rides with this passenger)
 * @param {string} token - Authentication token
 * @param {number} passengerId - Passenger ID
 * @returns {Promise} Passenger profile
 */
export function fetchPassengerProfile(token, passengerId) {
  return apiRequest(`/api/driver/passengers/${passengerId}`, {
    method: 'GET',
    token,
  })
}

