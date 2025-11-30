import { apiRequest } from './apiClient'

/**
 * Get all notifications for the authenticated user
 * @param {string} token - Authentication token
 * @param {number} page - Page number for pagination
 * @returns {Promise} Paginated notifications
 */
export function fetchNotifications(token, page = 1) {
  return apiRequest(`/api/notifications?page=${page}`, {
    method: 'GET',
    token,
  })
}

/**
 * Get unread notification count
 * @param {string} token - Authentication token
 * @returns {Promise} { unread_count: number }
 */
export function fetchUnreadCount(token) {
  return apiRequest('/api/notifications/unread-count', {
    method: 'GET',
    token,
  })
}

/**
 * Mark a notification as read
 * @param {string} token - Authentication token
 * @param {number} notificationId - Notification ID
 * @returns {Promise}
 */
export function markNotificationRead(token, notificationId) {
  return apiRequest(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
    token,
  })
}

/**
 * Mark all notifications as read
 * @param {string} token - Authentication token
 * @returns {Promise}
 */
export function markAllNotificationsRead(token) {
  return apiRequest('/api/notifications/read-all', {
    method: 'POST',
    token,
  })
}

/**
 * Delete a notification
 * @param {string} token - Authentication token
 * @param {number} notificationId - Notification ID
 * @returns {Promise}
 */
export function deleteNotification(token, notificationId) {
  return apiRequest(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
    token,
  })
}

