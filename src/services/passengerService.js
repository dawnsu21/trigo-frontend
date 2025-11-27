import { apiRequest } from './apiClient'

export function createPassengerRide(token, payload) {
  return apiRequest('/api/passenger/rides', {
    method: 'POST',
    token,
    body: payload,
  })
}

export function fetchCurrentPassengerRide(token) {
  return apiRequest('/api/passenger/rides/current', {
    method: 'GET',
    token,
  })
}

export function cancelPassengerRide(token, rideId) {
  return apiRequest(`/api/passenger/rides/${rideId}`, {
    method: 'DELETE',
    token,
  })
}

export function fetchPassengerHistory(token, page = 1) {
  return apiRequest(`/api/passenger/rides?page=${page}`, {
    method: 'GET',
    token,
  })
}

