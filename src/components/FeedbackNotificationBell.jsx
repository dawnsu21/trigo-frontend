import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { fetchAdminRides } from '../services/adminService'
import { fetchEmergencies } from '../services/emergencyService'
import './NotificationBell.css'

export default function FeedbackNotificationBell({ token }) {
  const [feedbacks, setFeedbacks] = useState([])
  const [emergencies, setEmergencies] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)
  const dropdownElementRef = useRef(null)

  const loadFeedbacks = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      // Since /api/admin/feedbacks doesn't exist, extract feedbacks from rides
      const ridesData = await fetchAdminRides(token)
      const rides = Array.isArray(ridesData) ? ridesData : ridesData?.data || []
      
      // Extract feedbacks from rides that have feedback data
      const feedbacksList = rides
        .filter(ride => ride.feedback || ride.rating || (ride.feedback_rating || ride.feedback_comment))
        .map(ride => ({
          id: ride.feedback?.id || ride.id,
          ride_id: ride.id,
          rating: ride.feedback?.rating || ride.rating || ride.feedback_rating || null,
          comment: ride.feedback?.comment || ride.feedback_comment || ride.comment || null,
          created_at: ride.feedback?.created_at || ride.feedback_date || ride.updated_at || ride.created_at,
          passenger: ride.passenger || null,
          ride: {
            id: ride.id,
            passenger: ride.passenger,
          },
        }))
        .filter(feedback => feedback.rating !== null) // Only include feedbacks with ratings
      
      setFeedbacks(feedbacksList)
      
      // Load emergencies
      try {
        const emergenciesData = await fetchEmergencies(token, { status: 'pending' })
        const emergenciesList = Array.isArray(emergenciesData) ? emergenciesData : emergenciesData?.data || []
        setEmergencies(emergenciesList)
        
        // Count unread feedbacks and pending emergencies
        const unreadFeedbacks = feedbacksList.filter(f => !f.is_read && !f.viewed).length
        const pendingEmergencies = emergenciesList.filter(e => e.status === 'pending').length
        setUnreadCount(unreadFeedbacks + pendingEmergencies)
      } catch (err) {
        console.error('Failed to load emergencies:', err)
        setEmergencies([])
        // Count only feedbacks if emergencies fail
        const unread = feedbacksList.filter(f => !f.is_read && !f.viewed).length
        setUnreadCount(unread)
      }
    } catch (err) {
      console.error('Failed to load feedbacks:', err)
      setFeedbacks([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      loadFeedbacks()
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadFeedbacks()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [token, loadFeedbacks])

  // Update dropdown position when open
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return

    const updatePosition = () => {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        top: `${buttonRect.bottom + 8}px`,
        right: `${window.innerWidth - buttonRect.right}px`,
        left: 'auto',
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

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const formatTime = (dateString) => {
    if (!dateString) return 'Unknown'
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

  const getRatingStars = (rating) => {
    return '⭐'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0))
  }

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        ref={buttonRef}
        className="notification-bell__button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Feedback Notifications"
        style={{ 
          fontSize: "1.25rem",
          backgroundColor: "#dbeafe",
          color: "#1e40af",
          border: "1px solid #93c5fd",
          padding: "0.5rem 0.75rem",
          borderRadius: "0.5rem",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#bfdbfe"
          e.target.style.borderColor = "#60a5fa"
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#dbeafe"
          e.target.style.borderColor = "#93c5fd"
        }}
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
              <h3>Feedbacks & Emergencies</h3>
              <button
                className="notification-bell__close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="notification-bell__list">
              {loading && (
                <div className="notification-bell__empty">
                  <p>Loading...</p>
                </div>
              )}

              {!loading && feedbacks.length === 0 && emergencies.length === 0 && (
                <div className="notification-bell__empty">
                  <p>No feedbacks or emergencies yet.</p>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.5rem" }}>
                    Passenger feedbacks and emergency reports will appear here.
                  </p>
                </div>
              )}

              {/* Emergency Reports First (Priority) */}
              {!loading && emergencies.length > 0 && emergencies.map((emergency) => (
                <div
                  key={`emergency-${emergency.id}`}
                  className={`notification-bell__item notification-bell__item--unread`}
                  style={{ borderLeft: "4px solid #ef4444" }}
                >
                  <div className="notification-bell__item-content">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <strong style={{ fontSize: "0.9375rem", color: "#ef4444" }}>
                          🚨 {emergency.title || "Emergency Report"}
                        </strong>
                        {emergency.ride_id && (
                          <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.5rem" }}>
                            Ride #{emergency.ride_id}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {formatTime(emergency.created_at)}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span style={{ 
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        backgroundColor: "#fee2e2",
                        color: "#991b1b"
                      }}>
                        {emergency.type || emergency.emergency_type || "Emergency"}
                      </span>
                    </div>

                    {emergency.description && (
                      <div style={{ 
                        fontSize: "0.875rem", 
                        color: "#334155",
                        lineHeight: "1.5",
                        marginTop: "0.5rem"
                      }}>
                        {emergency.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Feedbacks */}
              {!loading && feedbacks.length > 0 && feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className={`notification-bell__item ${!feedback.is_read && !feedback.viewed ? 'notification-bell__item--unread' : ''}`}
                >
                  <div className="notification-bell__item-content">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <strong style={{ fontSize: "0.9375rem" }}>
                          {feedback.passenger?.name || feedback.ride?.passenger?.name || "Anonymous Passenger"}
                        </strong>
                        {feedback.ride_id && (
                          <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.5rem" }}>
                            Ride #{feedback.ride_id}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {formatTime(feedback.created_at)}
                      </span>
                    </div>
                    
                    {feedback.rating && (
                      <div style={{ marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.875rem" }}>
                          {getRatingStars(feedback.rating)}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.5rem" }}>
                          ({feedback.rating}/5)
                        </span>
                      </div>
                    )}

                    {feedback.comment && (
                      <div style={{ 
                        fontSize: "0.875rem", 
                        color: "#334155",
                        lineHeight: "1.5",
                        marginTop: "0.5rem"
                      }}>
                        "{feedback.comment}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

