import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { reportEmergency } from '../services/emergencyService'
import './EmergencyButton.css'

const EMERGENCY_TYPES = [
  { value: 'safety_concern', label: 'Safety Concern' },
  { value: 'driver_emergency', label: 'Driver Emergency' },
  { value: 'passenger_emergency', label: 'Passenger Emergency' },
  { value: 'accident', label: 'Accident' },
  { value: 'other', label: 'Other' },
]

export default function EmergencyButton({ token, rideId = null, userRole = 'passenger' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    latitude: '',
    longitude: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setError('')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }))
          setError('')
        },
        (err) => {
          setError('Unable to get your location. Please enter coordinates manually.')
          console.error('Geolocation error:', err)
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
        }
      )
    } else {
      setError('Geolocation is not supported by your browser. Please enter coordinates manually.')
    }
  }

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setFormData({
      type: '',
      title: '',
      description: '',
      latitude: '',
      longitude: '',
    })
    setError('')
    setSuccess(false)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        type: formData.type,
        title: formData.title,
        description: formData.description,
      }

      // Always include ride_id to prevent backend "Undefined array key" error
      // Set to null if not provided, so backend can handle it
      if (rideId && rideId !== null && rideId !== undefined && rideId !== '') {
        payload.ride_id = parseInt(rideId)
      } else {
        payload.ride_id = null
      }

      if (formData.latitude && formData.longitude) {
        payload.latitude = parseFloat(formData.latitude)
        payload.longitude = parseFloat(formData.longitude)
      }

      await reportEmergency(token, payload)
      setSuccess(true)
      setFormData({
        type: '',
        title: '',
        description: '',
        latitude: '',
        longitude: '',
      })

      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to submit emergency report')
    } finally {
      setLoading(false)
    }
  }

  const availableTypes = userRole === 'driver'
    ? EMERGENCY_TYPES
    : EMERGENCY_TYPES.filter((t) => t.value !== 'driver_emergency')

  // Prevent body scroll when modal is open and handle ESC key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      
      const handleEscape = (e) => {
        if (e.key === 'Escape' && !loading) {
          handleClose()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', handleEscape)
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen, loading, handleClose])

  return (
    <>
      <button
        className="emergency-button"
        onClick={() => {
          setError('')
          setSuccess(false)
          setIsOpen(true)
        }}
        aria-label="Report Emergency"
        style={{
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
        }}
      >
Emergency
      </button>

      {isOpen &&
        createPortal(
          <div className="emergency-modal">
            <div className="emergency-modal__overlay" onClick={handleClose} />
            <div className="emergency-modal__content">
            <div className="emergency-modal__header">
              <h2>🚨 Report Emergency</h2>
              <button
                className="emergency-modal__close"
                onClick={handleClose}
                aria-label="Close"
                type="button"
              >
                ×
              </button>
            </div>

            {success ? (
              <div className="emergency-modal__success">
                <p>✅ Report submitted successfully. Admin has been notified.</p>
              </div>
            ) : (
              <form className="emergency-modal__form" onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert--error" role="alert">
                    {error}
                  </div>
                )}

                <label>
                  Emergency Type *
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select type...</option>
                    {availableTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Title *
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Brief description of the emergency"
                    required
                  />
                </label>

                <label>
                  Description *
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Provide detailed information about the emergency..."
                    rows="5"
                    required
                  />
                </label>

                <div className="emergency-modal__location">
                  <label>
                    Location (Optional)
                    <div className="emergency-modal__location-inputs">
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleChange}
                        placeholder="Latitude"
                      />
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleChange}
                        placeholder="Longitude"
                      />
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        className="emergency-modal__get-location"
                      >
                        📍 Get My Location
                      </button>
                    </div>
                  </label>
                </div>

                {rideId && (
                  <div className="alert alert--info">
                    This report will be linked to your current ride.
                  </div>
                )}

                <div className="emergency-modal__actions">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={loading || !formData.type || !formData.title || !formData.description}>
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

