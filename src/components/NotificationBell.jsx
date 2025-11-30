import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../services/notificationService'
import './NotificationBell.css'

export default function NotificationBell({ token, onNotificationClick }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)
  const dropdownElementRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await fetchNotifications(token)
      setNotifications(Array.isArray(data) ? data : data?.data || [])
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  const loadUnreadCount = useCallback(async () => {
    if (!token) return
    try {
      const data = await fetchUnreadCount(token)
      setUnreadCount(data?.unread_count || 0)
    } catch (err) {
      console.error('Failed to load unread count:', err)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      loadNotifications()
      loadUnreadCount()
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadNotifications()
        loadUnreadCount()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [token, loadNotifications, loadUnreadCount])

  // Update dropdown position when open, on scroll, or resize
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return

    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth = 400
      const dropdownHeight = 500
      const spacing = 8
      
      let right = window.innerWidth - rect.right
      if (right < spacing) {
        right = spacing
      }
      
      let top = rect.bottom + spacing
      if (top + dropdownHeight > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - dropdownHeight - spacing
        if (top < window.scrollY) {
          top = window.scrollY + spacing
        }
      } else {
        top = rect.bottom + window.scrollY + spacing
      }
      
      setDropdownStyle({
        top: `${top}px`,
        right: `${right}px`,
      })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  // Close dropdown when clicking outside (backdrop handles this now, but keep for keyboard/escape)
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(token, notification.id)
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
      }
    }
    
    // Call the callback if provided (for ride-related notifications)
    if (onNotificationClick && ['ride_accepted', 'driver_on_way', 'trip_completed'].includes(notification.type)) {
      onNotificationClick(notification)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(token)
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation()
    try {
      await deleteNotification(token, notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      setUnreadCount((prev) =>
        Math.max(0, prev - (notifications.find((n) => n.id === notificationId)?.is_read ? 0 : 1))
      )
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const getNotificationMessage = (notification) => {
    const type = notification.type
    
    switch (type) {
      case 'ride_accepted':
        return notification.data?.driver_name
          ? `Your driver has accepted your book. Driver: ${notification.data.driver_name}`
          : 'Your driver has accepted your book.'
      case 'driver_on_way':
        return notification.data?.driver_name
          ? `Your driver ${notification.data.driver_name} is on the way to pick you up.`
          : 'Your driver is on the way to pick you up.'
      case 'trip_completed':
        return 'Trip completed, thank you for riding with TriGo!'
      case 'driver_cancelled': {
        const reason = notification.data?.reason
        return reason
          ? `Your driver cancelled the trip. Search for a new one. Reason: ${reason}`
          : 'Your driver cancelled the trip. Search for a new one.'
      }
      case 'ride_cancelled':
        return 'You have successfully cancelled your ride.'
      case 'emergency_alert':
        return notification.data?.title
          ? `${notification.data.title} - ${notification.data.message || ''}`
          : notification.message || 'Emergency alert'
      case 'system_announcement':
        return notification.data?.title
          ? `${notification.data.title} - ${notification.data.message || ''}`
          : notification.message || 'System announcement'
      default:
        return notification.message || 'New notification'
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ride_accepted':
      case 'driver_on_way':
        return '✅'
      case 'trip_completed':
        return '🎉'
      case 'driver_cancelled':
      case 'ride_cancelled':
        return '⚠️'
      case 'emergency_alert':
        return '🚨'
      case 'system_announcement':
        return '📢'
      default:
        return '🔔'
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }


  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        ref={buttonRef}
        className="notification-bell__button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && createPortal(
        <>
          <div 
            className="notification-bell__backdrop"
            onClick={() => setIsOpen(false)}
          />
          <div 
            ref={dropdownElementRef}
            className="notification-bell__dropdown" 
            style={dropdownStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-bell__header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="notification-bell__mark-all"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-bell__list">
            {loading ? (
              <div className="notification-bell__empty">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-bell__empty">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-bell__item ${
                    !notification.is_read ? 'notification-bell__item--unread' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-bell__item-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-bell__item-content">
                    <p className="notification-bell__item-message">
                      {getNotificationMessage(notification)}
                    </p>
                    <span className="notification-bell__item-time">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                  <button
                    className="notification-bell__item-delete"
                    onClick={(e) => handleDelete(notification.id, e)}
                    aria-label="Delete notification"
                  >
                    ×
                  </button>
                  {!notification.is_read && (
                    <span className="notification-bell__item-dot"></span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        </>,
        document.body
      )}
    </div>
  )
}

