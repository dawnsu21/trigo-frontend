import { apiRequest } from './apiClient'

/**
 * Get all available places in Bulan
 * @param {string} token - Optional auth token (for admin)
 * @returns {Promise<Array>} List of places
 */
export function fetchPlaces(token = null) {
  return apiRequest('/api/places', {
    method: 'GET',
    token,
  })
}

/**
 * Search places by name
 * @param {string} query - Search query
 * @param {string} token - Optional auth token
 * @returns {Promise<Array>} Filtered list of places
 */
export function searchPlaces(query, token = null) {
  return apiRequest(`/api/places/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    token,
  })
}

/**
 * Get a single place by ID
 * @param {number} placeId - Place ID
 * @param {string} token - Optional auth token
 * @returns {Promise<Object>} Place details
 */
export function fetchPlace(placeId, token = null) {
  return apiRequest(`/api/places/${placeId}`, {
    method: 'GET',
    token,
  })
}

/**
 * Create a new place (Admin only)
 * @param {string} token - Admin auth token
 * @param {Object} placeData - Place information
 * @returns {Promise<Object>} Created place
 */
export function createPlace(token, placeData) {
  return apiRequest('/api/places', {
    method: 'POST',
    token,
    body: placeData,
  })
}

/**
 * Update a place (Admin only)
 * @param {string} token - Admin auth token
 * @param {number} placeId - Place ID
 * @param {Object} placeData - Updated place information
 * @returns {Promise<Object>} Updated place
 */
export function updatePlace(token, placeId, placeData) {
  return apiRequest(`/api/places/${placeId}`, {
    method: 'PUT',
    token,
    body: placeData,
  })
}

