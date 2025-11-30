import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  cancelPassengerRide,
  createPassengerRide,
  fetchCurrentPassengerRide,
  fetchPassengerHistory,
} from "../../services/passengerService";
import PlaceSelector from "../../components/PlaceSelector";
import DriverSelection from "../../components/DriverSelection";
import NotificationBell from "../../components/NotificationBell";
import EmergencyButton from "../../components/EmergencyButton";
import FeedbackForm from "../../components/FeedbackForm";
import { fetchAnnouncements } from "../../services/announcementService";
import "../../styles/dashboard.css";

const rideDefaults = {
  pickup_place_id: "",
  dropoff_place_id: "",
  notes: "",
};

export default function PassengerDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [rideForm, setRideForm] = useState(rideDefaults);
  const [currentRide, setCurrentRide] = useState(null);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingRide, setLoadingRide] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rideForFeedback, setRideForFeedback] = useState(null);
  const [showDriverSelection, setShowDriverSelection] = useState(false);
  const [pendingRideForm, setPendingRideForm] = useState(null);
  const [showCurrentRideDetails, setShowCurrentRideDetails] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setRideForm((prev) => ({ ...prev, [name]: value }));
  };

  const loadCurrentRide = useCallback(async () => {
    try {
      const data = await fetchCurrentPassengerRide(token);
      // Handle both direct response and wrapped response
      const rideData = data?.data || data;
      setCurrentRide(rideData || null);
      
      // Log can_cancel status for debugging
      if (rideData) {
        console.log("[PassengerDashboard] Current ride loaded:", {
          id: rideData.id,
          status: rideData.status,
          can_cancel: rideData.can_cancel,
          status_label: rideData.status_label
        });
      }
    } catch (err) {
      // If no current ride, that's okay - set to null
      if (err?.status === 404) {
        setCurrentRide(null);
      } else {
        setError(
          err?.message || err?.data?.message || "Unable to load current ride"
        );
      }
    }
  }, [token]);

  const loadHistory = useCallback(
    async (nextPage = 1) => {
      try {
        const data = await fetchPassengerHistory(token, nextPage);
        // Handle different response formats
        if (Array.isArray(data)) {
          setHistory(data);
        } else if (data?.data) {
          setHistory(data.data);
        } else {
          setHistory([]);
        }
        setPage(nextPage);
      } catch (err) {
        setError(
          err?.message || err?.data?.message || "Unable to load ride history"
        );
      }
    },
    [token]
  );

  const loadAnnouncements = useCallback(async () => {
    try {
      const data = await fetchAnnouncements(token);
      setAnnouncements(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadCurrentRide();
      loadHistory();
      loadAnnouncements();

      // Auto-refresh current ride every 10 seconds if there's an active ride
      const interval = setInterval(() => {
        loadCurrentRide();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [token, loadCurrentRide, loadHistory, loadAnnouncements]);

  // Check if we need to show feedback form for completed rides
  useEffect(() => {
    if (currentRide?.status === 'completed' && !showFeedback) {
      // Check if feedback was already submitted (this would need backend support)
      // For now, show feedback form
      setRideForFeedback(currentRide);
      setShowFeedback(true);
    }
  }, [currentRide, showFeedback]);

  const submitRide = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    
    // Store the form data and show driver selection
    setPendingRideForm({ ...rideForm });
    setShowDriverSelection(true);
  };

  const handleDriverSelected = async (driver) => {
    if (!pendingRideForm) return;

    setLoadingRide(true);
    setError("");
    setSuccess("");
    
    try {
      const ridePayload = {
        ...pendingRideForm,
        preferred_driver_id: driver.id,
      };
      
      await createPassengerRide(token, ridePayload);
      setRideForm(rideDefaults);
      setPendingRideForm(null);
      setShowDriverSelection(false);
      setSuccess(
        `Ride requested successfully! Your ride has been assigned to ${driver.name}.`
      );
      setError("");
      
      // Reload data after short delay
      setTimeout(() => {
        loadCurrentRide();
        loadHistory();
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.message ||
          "Ride request failed. The driver may no longer be available. Please try selecting another driver or skip to let the system find one."
      );
      setSuccess("");
      // Keep driver selection open so user can retry
    } finally {
      setLoadingRide(false);
    }
  };

  const handleSkipDriverSelection = async () => {
    if (!pendingRideForm) return;

    setLoadingRide(true);
    setError("");
    setSuccess("");
    
    try {
      // Create ride without preferred_driver_id (queue mode)
      await createPassengerRide(token, pendingRideForm);
      setRideForm(rideDefaults);
      setPendingRideForm(null);
      setShowDriverSelection(false);
      setSuccess(
        "Ride requested successfully! Searching for available drivers..."
      );
      setError("");
      
      // Reload data after short delay
      setTimeout(() => {
        loadCurrentRide();
        loadHistory();
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.message ||
          "Ride request failed. Please try again."
      );
      setSuccess("");
    } finally {
      setLoadingRide(false);
    }
  };

  const handleBackFromDriverSelection = () => {
    setShowDriverSelection(false);
    setPendingRideForm(null);
    setError("");
    setSuccess("");
  };

  // Helper function to check if ride can be cancelled
  // Uses backend can_cancel flag if available, otherwise checks status
  const canCancelRide = (ride) => {
    if (!ride) return false;
    
    // Use backend can_cancel flag if available
    if (ride.hasOwnProperty('can_cancel')) {
      return ride.can_cancel === true;
    }
    
    // Fallback to status check
    if (!ride.status) return false;
    const status = typeof ride.status === 'string' ? ride.status.toLowerCase() : ride.status;
    const cancellableStatuses = ['pending', 'assigned', 'accepted', 'requested'];
    return cancellableStatuses.includes(status);
  };

  const handleCancelClick = () => {
    if (!currentRide?.id) return;
    if (!canCancelRide(currentRide)) {
      setError("This ride cannot be cancelled in its current status.");
      return;
    }
    setShowCancelModal(true);
    setCancelReason("");
    setError("");
  };

  const cancelRide = async () => {
    if (!currentRide?.id) return;
    
    setLoadingRide(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await cancelPassengerRide(token, currentRide.id, cancelReason);
      
      // Handle success response
      const cancelledRide = response?.data?.ride || response?.ride || response?.data;
      
      setSuccess("Ride cancelled successfully.");
      setShowCancelModal(false);
      setCancelReason("");
      
      // Update current ride with cancelled status
      if (cancelledRide) {
        setCurrentRide(cancelledRide);
      } else {
        setCurrentRide(null);
      }
      
      // Reload data after short delay
      setTimeout(() => {
        loadCurrentRide();
        loadHistory();
        setSuccess("");
      }, 2000);
    } catch (err) {
      // Handle specific error codes
      if (err?.status === 403) {
        setError("You can only cancel your own rides.");
      } else if (err?.status === 422) {
        // Backend provides detailed reason for why cancellation failed
        const errorData = err?.data || {};
        const reason = errorData.reason || errorData.message || "Ride can no longer be cancelled.";
        const statusLabel = errorData.status_label || errorData.current_status || currentRide?.status;
        setError(`${statusLabel ? statusLabel + ': ' : ''}${reason}`);
      } else if (err?.status === 404) {
        setError("Ride not found.");
        setCurrentRide(null);
      } else {
        setError(
          err?.data?.message || err?.message || "Failed to cancel ride. Please try again."
        );
      }
    } finally {
      setLoadingRide(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h2>Passenger Dashboard</h2>
          <p>Welcome back, {user?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {currentRide && (
            <>
              <button 
                onClick={() => setShowCurrentRideDetails(!showCurrentRideDetails)}
                className={showCurrentRideDetails ? "secondary" : ""}
                style={{ 
                  backgroundColor: showCurrentRideDetails ? undefined : 'var(--accent-primary, #3b82f6)',
                  color: showCurrentRideDetails ? undefined : 'white',
                  border: showCurrentRideDetails ? undefined : 'none'
                }}
              >
                {showCurrentRideDetails ? "Hide Booking" : "📋 View My Booking"}
              </button>
              <button
                onClick={handleCancelClick}
                disabled={loadingRide || !canCancelRide(currentRide)}
                style={{ 
                  backgroundColor: canCancelRide(currentRide) ? 'var(--error, #ef4444)' : '#94a3b8',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: (loadingRide || !canCancelRide(currentRide)) ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: canCancelRide(currentRide) ? 1 : 0.7
                }}
                title={!canCancelRide(currentRide) ? `Cannot cancel ride. Current status: ${currentRide.status}` : "Cancel this booking"}
              >
                {loadingRide ? "⏳ Cancelling..." : "❌ Cancel Booking"}
              </button>
            </>
          )}
          <NotificationBell 
            token={token} 
            onNotificationClick={async (notification) => {
              // Only process 'ride_accepted' notification when driver has actually accepted
              // The backend should only send this notification when driver accepts, but we verify on frontend
              if (notification.type === 'ride_accepted') {
                // Reload current ride to verify driver has actually accepted
                try {
                  const updatedRide = await fetchCurrentPassengerRide(token);
                  
                  // Only show success message and action if driver has actually accepted (status is 'accepted' or 'picked_up')
                  // NOT if status is just 'assigned' (passenger selected driver, but driver hasn't accepted yet)
                  if (updatedRide && (updatedRide.status === 'accepted' || updatedRide.status === 'picked_up')) {
                    setCurrentRide(updatedRide);
                    setShowCurrentRideDetails(true);
                    setSuccess('🎉 Your driver has accepted your ride! Check your booking details below.');
                    setTimeout(() => setSuccess(''), 5000);
                    
                    // Scroll to current ride section after a short delay
                    setTimeout(() => {
                      const rideSection = document.querySelector('[data-current-ride-section]');
                      if (rideSection) {
                        rideSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 300);
                  } else if (updatedRide && updatedRide.status === 'assigned') {
                    // Status is 'assigned' - driver hasn't accepted yet, so don't show success message
                    // Just update the ride data silently
                    setCurrentRide(updatedRide);
                    console.log('Ride is assigned but driver has not accepted yet');
                  }
                } catch (err) {
                  console.error('Failed to load current ride:', err);
                  // If we can't verify, still show the ride but don't show success message
                  loadCurrentRide();
                }
              } else if (notification.type === 'driver_on_way') {
                // Driver is on the way - always show this
                setShowCurrentRideDetails(true);
                loadCurrentRide();
                setSuccess('🚗 Your driver is on the way!');
                setTimeout(() => setSuccess(''), 5000);
                
                setTimeout(() => {
                  const rideSection = document.querySelector('[data-current-ride-section]');
                  if (rideSection) {
                    rideSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 300);
              }
            }}
          />
          <EmergencyButton token={token} rideId={currentRide?.id} userRole="passenger" />
          <button 
            onClick={() => navigate('/passenger/profile')} 
            className="secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            👤 Profile
          </button>
          <button onClick={logout} className="secondary">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      {/* Driver Selection Screen */}
      {showDriverSelection && pendingRideForm && (
        <section className="panel">
          <DriverSelection
            token={token}
            pickupPlaceId={pendingRideForm.pickup_place_id || null}
            pickupLat={null}
            pickupLng={null}
            onSelectDriver={handleDriverSelected}
            onSkip={handleSkipDriverSelection}
            onBack={handleBackFromDriverSelection}
          />
        </section>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="panel" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h3>📢 Announcements</h3>
          {announcements.map((announcement) => (
            <div key={announcement.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>{announcement.title}</h4>
              <p style={{ margin: 0, color: '#64748b' }}>{announcement.message}</p>
            </div>
          ))}
        </section>
      )}

      {/* Cancel Ride Modal */}
      {showCancelModal && currentRide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCancelModal(false);
            setCancelReason("");
            setError("");
          }
        }}
        >
          <div className="panel" style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: 'white',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div className="panel__header">
              <div>
                <h3>❌ Cancel Ride</h3>
                <p className="panel__description">
                  Are you sure you want to cancel ride #{currentRide.id}?
                </p>
              </div>
              <button
                className="secondary"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setError("");
                }}
                disabled={loadingRide}
                style={{ fontSize: '1.5rem', lineHeight: 1, padding: '0.25rem 0.5rem' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>
                <strong>Reason for cancellation (optional):</strong>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Why are you cancelling this ride? (optional)"
                  style={{
                    width: '100%',
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  disabled={loadingRide}
                />
                <small style={{ color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                  {cancelReason.length}/500 characters
                </small>
              </label>
            </div>

            {error && (
              <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                className="secondary"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setError("");
                }}
                disabled={loadingRide}
              >
                Keep Ride
              </button>
              <button
                onClick={cancelRide}
                disabled={loadingRide}
                style={{
                  backgroundColor: 'var(--error, #ef4444)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: loadingRide ? 'not-allowed' : 'pointer',
                  opacity: loadingRide ? 0.7 : 1
                }}
              >
                {loadingRide ? '⏳ Cancelling...' : '✅ Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Form */}
      {showFeedback && rideForFeedback && (
        <section className="panel">
          <FeedbackForm
            token={token}
            rideId={rideForFeedback.id}
            onSuccess={() => {
              setShowFeedback(false);
              setRideForFeedback(null);
              setSuccess('Thank you for your feedback!');
            }}
            onSkip={() => {
              setShowFeedback(false);
              setRideForFeedback(null);
            }}
          />
        </section>
      )}

      {/* Show Current Ride Details prominently when button is clicked */}
      {showCurrentRideDetails && currentRide && (
        <section className="panel" style={{ borderLeft: '4px solid var(--accent-primary, #3b82f6)' }} data-current-ride-section>
          <div className="panel__header">
            <div>
              <h3>📋 My Current Booking</h3>
              <p className="panel__description">
                Your active ride details
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={handleCancelClick}
                disabled={loadingRide || !canCancelRide(currentRide)}
                style={{ 
                  backgroundColor: canCancelRide(currentRide) ? 'var(--error, #ef4444)' : '#94a3b8',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: (loadingRide || !canCancelRide(currentRide)) ? 'not-allowed' : 'pointer',
                  opacity: canCancelRide(currentRide) ? 1 : 0.7
                }}
                title={!canCancelRide(currentRide) ? `Cannot cancel ride. Current status: ${currentRide.status}` : "Cancel this booking"}
              >
                {loadingRide ? "⏳ Cancelling..." : "❌ Cancel Booking"}
              </button>
              <button className="secondary" onClick={() => setShowCurrentRideDetails(false)}>
                Close
              </button>
            </div>
          </div>
          <dl className="details">
            <div>
              <dt>Ride Number</dt>
              <dd>#{currentRide.id}</dd>
            </div>
            <div>
              <dt>Current Status</dt>
              <dd>
                <span
                  className={`status status--${currentRide.status
                    ?.toLowerCase()
                    .replace("_", "-")}`}
                >
                  {currentRide.status === "pending" && "Waiting for Driver"}
                  {currentRide.status === "assigned" && "Waiting for Driver Acceptance"}
                  {currentRide.status === "accepted" && "Driver Accepted - On the Way"}
                  {currentRide.status === "picked_up" && "On the Way"}
                  {currentRide.status === "completed" && "Completed"}
                  {currentRide.status === "cancelled" && "Cancelled"}
                  {![
                    "pending",
                    "assigned",
                    "accepted",
                    "picked_up",
                    "completed",
                    "cancelled",
                  ].includes(currentRide.status) && currentRide.status}
                </span>
              </dd>
            </div>
            <div>
              <dt>Your Driver</dt>
              <dd>
                {currentRide.status === "assigned" && currentRide.driver ? (
                  <div>
                    <strong>{currentRide.driver.name}</strong>
                    <div style={{ 
                      marginTop: '0.5rem',
                      padding: '0.75rem',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '0.5rem',
                      color: '#92400e',
                      fontSize: '0.875rem'
                    }}>
                      ⏳ <strong>Waiting for driver to accept...</strong><br />
                      The driver has been assigned but hasn't accepted yet. You'll be notified when they accept.
                    </div>
                  </div>
                ) : currentRide.status === "accepted" || currentRide.status === "picked_up" ? (
                  currentRide.driver ? (
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#f8fafc',
                      border: '2px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      marginTop: '0.5rem'
                    }}>
                      {/* Driver Header with Status */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <h4 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>
                            👤 {currentRide.driver.name}
                          </h4>
                          {currentRide.driver.average_rating && currentRide.driver.average_rating > 0 && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 0.75rem',
                              backgroundColor: '#fef3c7',
                              border: '1px solid #fbbf24',
                              borderRadius: '0.5rem'
                            }}>
                              <span style={{ fontSize: '1.25rem' }}>⭐</span>
                              <strong style={{ color: '#92400e' }}>
                                {parseFloat(currentRide.driver.average_rating).toFixed(1)}
                              </strong>
                              {currentRide.driver.total_ratings && (
                                <small style={{ color: '#92400e' }}>
                                  ({currentRide.driver.total_ratings} {currentRide.driver.total_ratings === 1 ? 'rating' : 'ratings'})
                                </small>
                              )}
                            </div>
                          )}
                        </div>
                        {currentRide.status === "accepted" && (
                          <div style={{ 
                            padding: '0.75rem 1rem',
                            backgroundColor: '#dbeafe',
                            border: '1px solid #3b82f6',
                            borderRadius: '0.5rem',
                            color: '#1e40af',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>
                            ✅ Driver Accepted - Heading to Pickup Location
                          </div>
                        )}
                        {currentRide.status === "picked_up" && (
                          <div style={{ 
                            padding: '0.75rem 1rem',
                            backgroundColor: '#dcfce7',
                            border: '1px solid #10b981',
                            borderRadius: '0.5rem',
                            color: '#065f46',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>
                            🚗 On the Way to Your Destination
                          </div>
                        )}
                      </div>

                      {/* Contact Information */}
                      {currentRide.driver.phone && (
                        <div style={{ 
                          marginBottom: '1.25rem',
                          padding: '1rem',
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.5rem'
                        }}>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <small style={{ display: 'block', marginBottom: '0.25rem', color: '#64748b', fontWeight: '600' }}>
                              📞 Contact Number
                            </small>
                            <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{currentRide.driver.phone}</strong>
                          </div>
                          <a 
                            href={`tel:${currentRide.driver.phone.replace(/\s+/g, '')}`}
                            style={{
                              display: 'inline-block',
                              width: '100%',
                              padding: '0.75rem 1.5rem',
                              backgroundColor: 'var(--accent-primary, #3b82f6)',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '0.5rem',
                              fontWeight: '600',
                              fontSize: '1rem',
                              textAlign: 'center',
                              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'var(--accent-primary, #3b82f6)'}
                          >
                            📞 Call Driver Now
                          </a>
                        </div>
                      )}

                      {/* Vehicle Information */}
                      {(currentRide.driver.vehicle_type || currentRide.driver.vehicle_make || currentRide.driver.vehicle_model) && (
                        <div style={{ 
                          marginBottom: '1.25rem',
                          padding: '1rem',
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.5rem'
                        }}>
                          <small style={{ display: 'block', marginBottom: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                            🚗 Vehicle Information
                          </small>
                          <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {currentRide.driver.vehicle_type && (
                              <div>
                                <strong style={{ color: '#0f172a' }}>Type:</strong>{' '}
                                <span style={{ color: '#475569' }}>{currentRide.driver.vehicle_type}</span>
                              </div>
                            )}
                            {(currentRide.driver.vehicle_make || currentRide.driver.vehicle_model) && (
                              <div>
                                <strong style={{ color: '#0f172a' }}>Make & Model:</strong>{' '}
                                <span style={{ color: '#475569' }}>
                                  {currentRide.driver.vehicle_make || ''} {currentRide.driver.vehicle_model || ''}
                                </span>
                              </div>
                            )}
                            {currentRide.driver.plate_number && (
                              <div>
                                <strong style={{ color: '#0f172a' }}>Plate Number:</strong>{' '}
                                <span style={{ 
                                  color: '#475569',
                                  fontFamily: 'monospace',
                                  fontSize: '1.1rem',
                                  fontWeight: '600'
                                }}>
                                  {currentRide.driver.plate_number}
                                </span>
                              </div>
                            )}
                            {currentRide.driver.license_number && (
                              <div>
                                <strong style={{ color: '#0f172a' }}>License Number:</strong>{' '}
                                <span style={{ color: '#475569' }}>{currentRide.driver.license_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Driver Location */}
                      {currentRide.driver.current_place && (
                        <div style={{ 
                          padding: '1rem',
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.5rem'
                        }}>
                          <small style={{ display: 'block', marginBottom: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                            📍 Driver's Current Location
                          </small>
                          <div>
                            <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'block', marginBottom: '0.25rem' }}>
                              {currentRide.driver.current_place.name}
                            </strong>
                            {currentRide.driver.current_place.address && (
                              <small style={{ color: '#64748b', display: 'block' }}>
                                {currentRide.driver.current_place.address}
                              </small>
                            )}
                            {currentRide.driver.distance_km && (
                              <div style={{ 
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                backgroundColor: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                borderRadius: '0.375rem',
                                display: 'inline-block'
                              }}>
                                <small style={{ color: '#0369a1' }}>
                                  📏 Distance: {parseFloat(currentRide.driver.distance_km).toFixed(1)} km away
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted">Driver information loading...</span>
                  )
                ) : currentRide.driver ? (
                  <>
                    <strong>{currentRide.driver.name}</strong>
                    {currentRide.driver.phone && (
                      <>
                        <br />
                        <small>Contact: {currentRide.driver.phone}</small>
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-muted">
                    Searching for available driver...
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt>Vehicle Type</dt>
              <dd>
                {(currentRide.status === "accepted" || currentRide.status === "picked_up") && currentRide.driver?.vehicle_type
                  ? currentRide.driver.vehicle_type
                  : currentRide.driver?.vehicle_type || "Not available yet"}
              </dd>
            </div>
            <div>
              <dt>Estimated Fare</dt>
              <dd>
                ₱
                {currentRide.fare
                  ? parseFloat(currentRide.fare).toFixed(2)
                  : "0.00"}
              </dd>
            </div>
            {(currentRide.pickup_address || currentRide.pickup_place) && (
              <div>
                <dt>Pickup Location</dt>
                <dd>
                  {currentRide.pickup_place?.name ||
                    currentRide.pickup_address}
                  {currentRide.pickup_place?.address && (
                    <>
                      <br />
                      <small className="text-muted">
                        {currentRide.pickup_place.address}
                      </small>
                    </>
                  )}
                </dd>
              </div>
            )}
            {(currentRide.dropoff_address || currentRide.dropoff_place) && (
              <div>
                <dt>Destination</dt>
                <dd>
                  {currentRide.dropoff_place?.name ||
                    currentRide.dropoff_address}
                  {currentRide.dropoff_place?.address && (
                    <>
                      <br />
                      <small className="text-muted">
                        {currentRide.dropoff_place.address}
                      </small>
                    </>
                  )}
                </dd>
              </div>
            )}
          </dl>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              className="secondary"
              onClick={loadCurrentRide}
              disabled={loadingRide}
            >
              🔄 Refresh Status
            </button>
            {canCancelRide(currentRide) ? (
              <button
                onClick={handleCancelClick}
                disabled={loadingRide}
                style={{ 
                  backgroundColor: 'var(--error, #ef4444)',
                  color: 'white',
                  border: 'none',
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: loadingRide ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                }}
              >
                {loadingRide ? "⏳ Cancelling..." : "❌ Cancel Booking"}
              </button>
            ) : (
              <div style={{ 
                flex: 1, 
                padding: '0.75rem 1.5rem', 
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.875rem'
              }}>
                {currentRide.status === "picked_up" && "Ride is in progress. Cancellation is no longer available."}
                {currentRide.status === "completed" && "This ride has been completed."}
                {currentRide.status === "cancelled" && "This ride has been cancelled."}
                {!["picked_up", "completed", "cancelled"].includes(currentRide.status) && 
                 !["pending", "assigned", "accepted", "requested"].includes(currentRide.status) && 
                 `Current status: ${currentRide.status}. Cancellation may not be available.`}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="dashboard__grid">
        {!showDriverSelection && (
        <article className="panel">
          <h3>Book a Ride</h3>
          <p className="panel__description">
            Select your pickup and drop-off locations in Bulan to request a
            tricycle ride. After selecting locations, you'll be able to choose a driver or let the system find one for you.
          </p>
          <form className="form form--stacked" onSubmit={submitRide}>
            <div className="form__section">
              <h4>Pickup Location</h4>
              <PlaceSelector
                name="pickup_place_id"
                label="Where will you be picked up?"
                value={rideForm.pickup_place_id}
                onChange={handleChange}
                placeholder="Search for pickup location (e.g., Bulan Public Market, Barangay Poblacion...)"
                required
              />
            </div>

            <div className="form__section">
              <h4>Drop-off Location</h4>
              <PlaceSelector
                name="dropoff_place_id"
                label="Where do you want to go?"
                value={rideForm.dropoff_place_id}
                onChange={handleChange}
                placeholder="Search for destination (e.g., Bulan Port, Bulan Town Plaza...)"
                required
              />
            </div>

            <label>
              Additional Notes (Optional)
              <textarea
                name="notes"
                value={rideForm.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any special instructions for the driver (e.g., 'Please wait at the main entrance', 'I have luggage')..."
              />
              <small>
                Add any special instructions or notes for the driver
              </small>
            </label>
            <button
              type="submit"
              disabled={
                loadingRide ||
                !rideForm.pickup_place_id ||
                !rideForm.dropoff_place_id
              }
            >
              {loadingRide ? "Loading..." : "Continue to Driver Selection"}
            </button>
          </form>
        </article>
        )}

        {!showCurrentRideDetails && (
        <article className="panel">
          <div className="panel__header">
            <div>
              <h3>Current Ride</h3>
              <p className="panel__description">
                Track your active ride in real-time
              </p>
            </div>
            <button className="secondary" onClick={loadCurrentRide}>
              Refresh
            </button>
          </div>
          {currentRide ? (
            <>
              <dl className="details">
                <div>
                  <dt>Ride Number</dt>
                  <dd>#{currentRide.id}</dd>
                </div>
                <div>
                  <dt>Current Status</dt>
                  <dd>
                    <span
                      className={`status status--${currentRide.status
                        ?.toLowerCase()
                        .replace("_", "-")}`}
                    >
                      {currentRide.status === "pending" && "Waiting for Driver"}
                      {currentRide.status === "assigned" && "Waiting for Driver Acceptance"}
                      {currentRide.status === "accepted" && "Driver Accepted - On the Way"}
                      {currentRide.status === "picked_up" && "On the Way"}
                      {currentRide.status === "completed" && "Completed"}
                      {currentRide.status === "cancelled" && "Cancelled"}
                      {![
                        "pending",
                        "assigned",
                        "accepted",
                        "picked_up",
                        "completed",
                        "cancelled",
                      ].includes(currentRide.status) && currentRide.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Your Driver</dt>
                  <dd>
                    {currentRide.status === "assigned" && currentRide.driver ? (
                      <div>
                        <strong>{currentRide.driver.name}</strong>
                        <div style={{ 
                          marginTop: '0.5rem',
                          padding: '0.75rem',
                          backgroundColor: '#fef3c7',
                          border: '1px solid #fbbf24',
                          borderRadius: '0.5rem',
                          color: '#92400e',
                          fontSize: '0.875rem'
                        }}>
                          ⏳ <strong>Waiting for driver to accept...</strong><br />
                          The driver has been assigned but hasn't accepted yet. You'll be notified when they accept.
                        </div>
                      </div>
                    ) : currentRide.status === "accepted" || currentRide.status === "picked_up" ? (
                      currentRide.driver ? (
                        <div style={{
                          padding: '1.5rem',
                          backgroundColor: '#f8fafc',
                          border: '2px solid #e2e8f0',
                          borderRadius: '0.75rem',
                          marginTop: '0.5rem'
                        }}>
                          {/* Driver Header with Status */}
                          <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                              <h4 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>
                                👤 {currentRide.driver.name}
                              </h4>
                              {currentRide.driver.average_rating && currentRide.driver.average_rating > 0 && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '0.5rem 0.75rem',
                                  backgroundColor: '#fef3c7',
                                  border: '1px solid #fbbf24',
                                  borderRadius: '0.5rem'
                                }}>
                                  <span style={{ fontSize: '1.25rem' }}>⭐</span>
                                  <strong style={{ color: '#92400e' }}>
                                    {parseFloat(currentRide.driver.average_rating).toFixed(1)}
                                  </strong>
                                  {currentRide.driver.total_ratings && (
                                    <small style={{ color: '#92400e' }}>
                                      ({currentRide.driver.total_ratings} {currentRide.driver.total_ratings === 1 ? 'rating' : 'ratings'})
                                    </small>
                                  )}
                                </div>
                              )}
                            </div>
                            {currentRide.status === "accepted" && (
                              <div style={{ 
                                padding: '0.75rem 1rem',
                                backgroundColor: '#dbeafe',
                                border: '1px solid #3b82f6',
                                borderRadius: '0.5rem',
                                color: '#1e40af',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}>
                                ✅ Driver Accepted - Heading to Pickup Location
                              </div>
                            )}
                            {currentRide.status === "picked_up" && (
                              <div style={{ 
                                padding: '0.75rem 1rem',
                                backgroundColor: '#dcfce7',
                                border: '1px solid #10b981',
                                borderRadius: '0.5rem',
                                color: '#065f46',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}>
                                🚗 On the Way to Your Destination
                              </div>
                            )}
                          </div>

                          {/* Contact Information */}
                          {currentRide.driver.phone && (
                            <div style={{ 
                              marginBottom: '1.25rem',
                              padding: '1rem',
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '0.5rem'
                            }}>
                              <div style={{ marginBottom: '0.75rem' }}>
                                <small style={{ display: 'block', marginBottom: '0.25rem', color: '#64748b', fontWeight: '600' }}>
                                  📞 Contact Number
                                </small>
                                <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{currentRide.driver.phone}</strong>
                              </div>
                              <a 
                                href={`tel:${currentRide.driver.phone.replace(/\s+/g, '')}`}
                                style={{
                                  display: 'inline-block',
                                  width: '100%',
                                  padding: '0.75rem 1.5rem',
                                  backgroundColor: 'var(--accent-primary, #3b82f6)',
                                  color: 'white',
                                  textDecoration: 'none',
                                  borderRadius: '0.5rem',
                                  fontWeight: '600',
                                  fontSize: '1rem',
                                  textAlign: 'center',
                                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'var(--accent-primary, #3b82f6)'}
                              >
                                📞 Call Driver Now
                              </a>
                            </div>
                          )}

                          {/* Vehicle Information */}
                          {(currentRide.driver.vehicle_type || currentRide.driver.vehicle_make || currentRide.driver.vehicle_model) && (
                            <div style={{ 
                              marginBottom: '1.25rem',
                              padding: '1rem',
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '0.5rem'
                            }}>
                              <small style={{ display: 'block', marginBottom: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                                🚗 Vehicle Information
                              </small>
                              <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {currentRide.driver.vehicle_type && (
                                  <div>
                                    <strong style={{ color: '#0f172a' }}>Type:</strong>{' '}
                                    <span style={{ color: '#475569' }}>{currentRide.driver.vehicle_type}</span>
                                  </div>
                                )}
                                {(currentRide.driver.vehicle_make || currentRide.driver.vehicle_model) && (
                                  <div>
                                    <strong style={{ color: '#0f172a' }}>Make & Model:</strong>{' '}
                                    <span style={{ color: '#475569' }}>
                                      {currentRide.driver.vehicle_make || ''} {currentRide.driver.vehicle_model || ''}
                                    </span>
                                  </div>
                                )}
                                {currentRide.driver.plate_number && (
                                  <div>
                                    <strong style={{ color: '#0f172a' }}>Plate Number:</strong>{' '}
                                    <span style={{ 
                                      color: '#475569',
                                      fontFamily: 'monospace',
                                      fontSize: '1.1rem',
                                      fontWeight: '600'
                                    }}>
                                      {currentRide.driver.plate_number}
                                    </span>
                                  </div>
                                )}
                                {currentRide.driver.license_number && (
                                  <div>
                                    <strong style={{ color: '#0f172a' }}>License Number:</strong>{' '}
                                    <span style={{ color: '#475569' }}>{currentRide.driver.license_number}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Driver Location */}
                          {currentRide.driver.current_place && (
                            <div style={{ 
                              padding: '1rem',
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '0.5rem'
                            }}>
                              <small style={{ display: 'block', marginBottom: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                                📍 Driver's Current Location
                              </small>
                              <div>
                                <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'block', marginBottom: '0.25rem' }}>
                                  {currentRide.driver.current_place.name}
                                </strong>
                                {currentRide.driver.current_place.address && (
                                  <small style={{ color: '#64748b', display: 'block' }}>
                                    {currentRide.driver.current_place.address}
                                  </small>
                                )}
                                {currentRide.driver.distance_km && (
                                  <div style={{ 
                                    marginTop: '0.5rem',
                                    padding: '0.5rem',
                                    backgroundColor: '#f0f9ff',
                                    border: '1px solid #bae6fd',
                                    borderRadius: '0.375rem',
                                    display: 'inline-block'
                                  }}>
                                    <small style={{ color: '#0369a1' }}>
                                      📏 Distance: {parseFloat(currentRide.driver.distance_km).toFixed(1)} km away
                                    </small>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">Driver information loading...</span>
                      )
                    ) : currentRide.driver ? (
                      <>
                        <strong>{currentRide.driver.name}</strong>
                        {currentRide.driver.phone && (
                          <>
                            <br />
                            <small>Contact: {currentRide.driver.phone}</small>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-muted">
                        Searching for available driver...
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Vehicle Type</dt>
                  <dd>
                    {(currentRide.status === "accepted" || currentRide.status === "picked_up") && currentRide.driver?.vehicle_type
                      ? currentRide.driver.vehicle_type
                      : currentRide.driver?.vehicle_type || "Not available yet"}
                  </dd>
                </div>
                <div>
                  <dt>Estimated Fare</dt>
                  <dd>
                    ₱
                    {currentRide.fare
                      ? parseFloat(currentRide.fare).toFixed(2)
                      : "0.00"}
                  </dd>
                </div>
                {(currentRide.pickup_address || currentRide.pickup_place) && (
                  <div>
                    <dt>Pickup Location</dt>
                    <dd>
                      {currentRide.pickup_place?.name ||
                        currentRide.pickup_address}
                      {currentRide.pickup_place?.address && (
                        <>
                          <br />
                          <small className="text-muted">
                            {currentRide.pickup_place.address}
                          </small>
                        </>
                      )}
                    </dd>
                  </div>
                )}
                {(currentRide.dropoff_address || currentRide.dropoff_place) && (
                  <div>
                    <dt>Destination</dt>
                    <dd>
                      {currentRide.dropoff_place?.name ||
                        currentRide.dropoff_address}
                      {currentRide.dropoff_place?.address && (
                        <>
                          <br />
                          <small className="text-muted">
                            {currentRide.dropoff_place.address}
                          </small>
                        </>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
              <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  className="secondary"
                  onClick={loadCurrentRide}
                  disabled={loadingRide}
                >
                  🔄 Refresh Status
                </button>
                <button
                  onClick={handleCancelClick}
                  disabled={loadingRide || !canCancelRide(currentRide)}
                  style={{ 
                    backgroundColor: canCancelRide(currentRide) ? 'var(--error, #ef4444)' : '#94a3b8',
                    color: 'white',
                    border: 'none',
                    flex: 1,
                    minWidth: '200px',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: (loadingRide || !canCancelRide(currentRide)) ? 'not-allowed' : 'pointer',
                    boxShadow: canCancelRide(currentRide) ? '0 2px 4px rgba(239, 68, 68, 0.2)' : 'none',
                    opacity: canCancelRide(currentRide) ? 1 : 0.6
                  }}
                  title={!canCancelRide(currentRide) ? `Cannot cancel ride with status: ${currentRide.status}` : "Cancel this ride"}
                >
                  {loadingRide ? "⏳ Cancelling..." : "❌ Cancel Booking"}
                </button>
                {!canCancelRide(currentRide) && (
                  <div style={{ 
                    width: '100%',
                    padding: '0.5rem', 
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.875rem',
                    fontStyle: 'italic'
                  }}>
                    {currentRide.status === "picked_up" && "⏸️ Ride is in progress. Cancellation is no longer available."}
                    {currentRide.status === "completed" && "✅ This ride has been completed."}
                    {currentRide.status === "cancelled" && "🚫 This ride has been cancelled."}
                    {!["picked_up", "completed", "cancelled"].includes(currentRide.status) && 
                     `ℹ️ Current status: ${currentRide.status}. Cancellation may not be available at this time.`}
                  </div>
                )}
              </div>
              {!["pending", "assigned", "accepted"].includes(currentRide.status) && currentRide.status !== "cancelled" && (
                <div style={{ marginTop: "1rem" }}>
                  <p className="text-muted" style={{ fontSize: "0.875rem" }}>
                    {currentRide.status === "picked_up" && "Ride is in progress. Cancellation is no longer available."}
                    {currentRide.status === "completed" && "This ride has been completed."}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="panel__empty">
              <p>You don't have an active ride right now.</p>
              <p className="text-muted">
                Use the "Book a Ride" form to request a tricycle ride.
              </p>
            </div>
          )}
        </article>
        )}
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Ride History</h3>
            <p className="panel__description">
              View all your past and completed rides
            </p>
          </div>
          <div>
            <button
              className="secondary"
              onClick={() => loadHistory(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </button>
            <button className="secondary" onClick={() => loadHistory(page + 1)}>
              Next
            </button>
          </div>
        </div>
        {history.length === 0 ? (
          <div className="panel__empty">
            <p>You haven't taken any rides yet.</p>
            <p className="text-muted">
              Your ride history will appear here after you book your first ride.
            </p>
          </div>
        ) : (
          <div className="table">
            <div className="table__head">
              <span>Ride #</span>
              <span>Ride Details</span>
              <span>Status</span>
              <span>Fare Amount</span>
              <span>Date</span>
            </div>
            {history.map((ride) => (
              <div className="table__row" key={ride.id}>
                <span>#{ride.id}</span>
                <span>
                  <div>
                    {ride.driver ? (
                      <>
                        <strong>{ride.driver.name}</strong>
                        {ride.driver.vehicle_type && (
                          <>
                            <br />
                            <small className="text-muted">
                              {ride.driver.vehicle_type}
                            </small>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-muted">No driver assigned</span>
                    )}
                  </div>
                  {(ride.pickup_place || ride.pickup_address) && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
                      <strong>From:</strong>{" "}
                      {ride.pickup_place?.name || ride.pickup_address}
                    </div>
                  )}
                  {(ride.dropoff_place || ride.dropoff_address) && (
                    <div style={{ fontSize: "0.875rem" }}>
                      <strong>To:</strong>{" "}
                      {ride.dropoff_place?.name || ride.dropoff_address}
                    </div>
                  )}
                </span>
                <span>
                  <span
                    className={`status status--${ride.status
                      ?.toLowerCase()
                      .replace("_", "-")}`}
                  >
                    {ride.status === "completed" && "Completed"}
                    {ride.status === "cancelled" && "Cancelled"}
                    {ride.status === "pending" && "Pending"}
                    {!["completed", "cancelled", "pending"].includes(
                      ride.status
                    ) && ride.status}
                  </span>
                </span>
                <span>
                  ₱{ride.fare ? parseFloat(ride.fare).toFixed(2) : "0.00"}
                </span>
                <span>
                  {ride.created_at
                    ? new Date(ride.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : ride.updated_at
                    ? new Date(ride.updated_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
