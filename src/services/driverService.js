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

