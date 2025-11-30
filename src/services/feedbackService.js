import { apiRequest } from './apiClient'

/**
 * Submit feedback for a completed ride
 * @param {string} token - Authentication token
 * @param {Object} payload - Feedback data
 * @param {number} payload.ride_id - Ride ID
 * @param {number} payload.rating - Rating from 1-5
 * @param {string} payload.comment - Optional comment
 * @returns {Promise}
 */
export function submitFeedback(token, payload) {
  return apiRequest('/api/feedback', {
    method: 'POST',
    token,
    body: payload,
  })
}

