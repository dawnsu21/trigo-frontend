import { apiRequest } from './apiClient'

/**
 * Get active announcements for the authenticated user
 * @param {string} token - Authentication token
 * @returns {Promise} List of announcements
 */
export function fetchAnnouncements(token) {
  return apiRequest('/api/announcements', {
    method: 'GET',
    token,
  })
}

/**
 * Admin: Get all announcements
 * @param {string} token - Authentication token
 * @returns {Promise}
 */
export function fetchAdminAnnouncements(token) {
  return apiRequest('/api/admin/announcements', {
    method: 'GET',
    token,
  })
}

/**
 * Admin: Create an announcement
 * @param {string} token - Authentication token
 * @param {Object} payload - Announcement data
 * @param {string} payload.type - Type: "maintenance" | "system_update" | "general" | "urgent"
 * @param {string} payload.title - Announcement title
 * @param {string} payload.message - Announcement message
 * @param {string} payload.start_date - Optional start date
 * @param {string} payload.end_date - Optional end date
 * @param {string} payload.target_audience - "all" | "drivers" | "passengers" | "admins"
 * @returns {Promise}
 */
export function createAnnouncement(token, payload) {
  return apiRequest('/api/admin/announcements', {
    method: 'POST',
    token,
    body: payload,
  })
}

/**
 * Admin: Update an announcement
 * @param {string} token - Authentication token
 * @param {number} announcementId - Announcement ID
 * @param {Object} payload - Updated announcement data
 * @returns {Promise}
 */
export function updateAnnouncement(token, announcementId, payload) {
  return apiRequest(`/api/admin/announcements/${announcementId}`, {
    method: 'PUT',
    token,
    body: payload,
  })
}

/**
 * Admin: Delete an announcement
 * @param {string} token - Authentication token
 * @param {number} announcementId - Announcement ID
 * @returns {Promise}
 */
export function deleteAnnouncement(token, announcementId) {
  return apiRequest(`/api/admin/announcements/${announcementId}`, {
    method: 'DELETE',
    token,
  })
}

