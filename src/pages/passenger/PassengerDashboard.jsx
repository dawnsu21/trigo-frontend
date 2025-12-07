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
import "../../styles/passenger-dashboard.css";

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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allHistory, setAllHistory] = useState([]);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);

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
        const historyData = Array.isArray(data) ? data : data?.data || [];
        setHistory(historyData);
        setAllHistory(historyData); // Store all history for search
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
      const announcementsData = Array.isArray(data) ? data : data?.data || [];
      setAnnouncements(announcementsData);
      setAllAnnouncements(announcementsData); // Store all announcements for search
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  }, [token]);

  // Filter history and announcements based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(allHistory);
      setFilteredAnnouncements(allAnnouncements);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    
    // Filter history
    const filteredHist = allHistory.filter((ride) => {
      const driverName = (ride.driver?.name || "").toLowerCase();
      const pickup = (ride.pickup_place?.name || ride.pickup_address || "").toLowerCase();
      const dropoff = (ride.dropoff_place?.name || ride.dropoff_address || "").toLowerCase();
      const rideId = String(ride.id || "").toLowerCase();
      const fare = String(ride.fare || "").toLowerCase();
      const status = (ride.status || "").toLowerCase();
      const vehicleType = (ride.driver?.vehicle_type || "").toLowerCase();

      return (
        driverName.includes(query) ||
        pickup.includes(query) ||
        dropoff.includes(query) ||
        rideId.includes(query) ||
        fare.includes(query) ||
        status.includes(query) ||
        vehicleType.includes(query)
      );
    });

    // Filter announcements
    const filteredAnn = allAnnouncements.filter((announcement) => {
      const title = (announcement.title || "").toLowerCase();
      const message = (announcement.message || "").toLowerCase();

      return (
        title.includes(query) ||
        message.includes(query)
      );
    });

    setFilteredHistory(filteredHist);
    setFilteredAnnouncements(filteredAnn);
  }, [searchQuery, allHistory, allAnnouncements]);

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
    
    // Use backend can_cancel flag if available (this is the primary check)
    if (ride.hasOwnProperty('can_cancel')) {
      return ride.can_cancel === true;
    }
    
    // Fallback to status check
    // If status is null/undefined, assume it might be cancellable (pending state)
    if (!ride.status || ride.status === null || ride.status === undefined) {
      // If we don't have status info, allow cancellation attempt
      // The backend will handle the actual validation
      return true;
    }
    
    const status = typeof ride.status === 'string' ? ride.status.toLowerCase() : String(ride.status).toLowerCase();
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

  // Use filtered data for display
  const displayHistory = searchQuery.trim() ? filteredHistory : history;
  const displayAnnouncements = searchQuery.trim() ? filteredAnnouncements : announcements;

  return (
    <div className="dashboard passenger-dashboard">
      <header className="dashboard__header" style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr auto 1fr",
        gap: "1rem",
        alignItems: "center"
      }}>
        <div>
          <h2>Passenger Dashboard</h2>
          <p>Welcome back, {user?.name}</p>
        </div>
        <div style={{ 
          display: "flex", 
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          minWidth: "400px",
          maxWidth: "700px",
          width: "100%",
          position: "relative"
        }}>
          <div style={{ position: "relative", flex: 1, width: "100%" }}>
            {/* Search Icon */}
            <svg
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "20px",
                height: "20px",
                color: "var(--text-secondary)",
                pointerEvents: "none",
                zIndex: 1,
              }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search rides, announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "1rem 1rem 1rem 3rem",
                paddingRight: searchQuery ? "3rem" : "1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--card-border)",
                fontSize: "1rem",
                fontFamily: "inherit",
                outline: "none",
                transition: "var(--transition)",
                backgroundColor: "var(--card-bg)",
                color: "var(--text-primary)",
                fontWeight: "400",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent-primary)";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--card-border)";
                e.target.style.boxShadow = "none";
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary)",
                  fontSize: "1.5rem",
                  lineHeight: 1,
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  transition: "var(--transition)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "var(--text-primary)";
                  e.target.style.backgroundColor = "var(--card-border)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "var(--text-secondary)";
                  e.target.style.backgroundColor = "transparent";
                }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          {searchQuery && (
            <div style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
              padding: "0.5rem 0",
              fontWeight: "500",
            }}>
              {displayHistory.length + displayAnnouncements.length} result{(displayHistory.length + displayAnnouncements.length) !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: "flex-end" }}>
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
                    setSuccess('🎉 Your driver has accepted your ride! Check your booking details.');
                    setTimeout(() => setSuccess(''), 5000);
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
                loadCurrentRide();
                setSuccess('🚗 Your driver is on the way!');
                setTimeout(() => setSuccess(''), 5000);
              }
            }}
          />
          {currentRide && (
            <>
              <button 
                onClick={() => navigate('/passenger/view-booking')}
                style={{ 
                  backgroundColor: 'var(--accent-primary, #3b82f6)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.9375rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                View My Booking
              </button>
            </>
          )}
          <EmergencyButton token={token} rideId={currentRide?.id} userRole="passenger" />
          <button 
            onClick={() => navigate('/passenger/profile')} 
            className="secondary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              fontSize: '0.9375rem',
              whiteSpace: 'nowrap'
            }}
          >
            👤 Profile
          </button>
          <button 
            onClick={logout} 
            className="secondary"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              fontSize: '0.9375rem',
              whiteSpace: 'nowrap'
            }}
          >
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
      {displayAnnouncements.length > 0 && (
        <section className="panel" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h3>📢 Announcements</h3>
          {displayAnnouncements.map((announcement) => (
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
                <h3>Cancel Ride</h3>
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

      <section className="dashboard__grid">
        {!showDriverSelection && (
        <article className="panel floating-panel floating-panel--book-ride">
          <h3>🚕 Book a Ride</h3>
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

        <article className="panel floating-panel floating-panel--current-ride">
          <div className="panel__header">
            <div>
              <h3>🚗 Current Ride</h3>
              <p className="panel__description">
                Track your active ride in real-time
              </p>
            </div>
            <button className="secondary" onClick={loadCurrentRide} disabled={loadingRide}>
              {loadingRide ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          
          {currentRide ? (
            <div className="current-ride-content">
              {/* Ride Header - Status and ID */}
              <div className="ride-header">
                <div className="ride-id-status">
                  <span className="ride-id">Ride #{currentRide.id}</span>
                  <span className={`status status--${currentRide.status?.toLowerCase().replace("_", "-")}`}>
                    {currentRide.status === "pending" && "⏳ Waiting for Driver"}
                    {currentRide.status === "assigned" && "⏳ Waiting for Acceptance"}
                    {currentRide.status === "accepted" && "✅ Driver Accepted"}
                    {currentRide.status === "picked_up" && "🚗 On the Way"}
                    {currentRide.status === "completed" && "✅ Completed"}
                    {currentRide.status === "cancelled" && "🚫 Cancelled"}
                    {!["pending", "assigned", "accepted", "picked_up", "completed", "cancelled"].includes(currentRide.status) && currentRide.status}
                  </span>
                </div>
                <div className="ride-driver">
                  <span className="driver-label">Assigned Driver</span>
                  <span className="driver-name">
                    {currentRide.driver ? (
                      <strong>{currentRide.driver.name}</strong>
                    ) : (
                      <span style={{ color: '#64748b', fontStyle: 'italic' }}>Not assigned yet</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Route Information */}
              <div className="route-info">
                <div className="route-item pickup">
                  <div className="route-icon">📍</div>
                  <div className="route-details">
                    <div className="route-label">Pickup</div>
                    <div className="route-name">{currentRide.pickup_place?.name || currentRide.pickup_address || "Not specified"}</div>
                    {currentRide.pickup_place?.address && (
                      <div className="route-address">{currentRide.pickup_place.address}</div>
                    )}
                  </div>
                </div>
                <div className="route-arrow">↓</div>
                <div className="route-item dropoff">
                  <div className="route-icon">📍</div>
                  <div className="route-details">
                    <div className="route-label">Destination</div>
                    <div className="route-name">{currentRide.dropoff_place?.name || currentRide.dropoff_address || "Not specified"}</div>
                    {currentRide.dropoff_place?.address && (
                      <div className="route-address">{currentRide.dropoff_place.address}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Driver Information - Only show when driver is assigned */}
              {currentRide.driver && (
                <div className="driver-info-card">
                  {currentRide.status === "assigned" && (
                    <div className="status-alert status-alert--warning">
                      ⏳ <strong>Waiting for driver to accept...</strong> You'll be notified when they accept.
                    </div>
                  )}
                  
                  {(currentRide.status === "accepted" || currentRide.status === "picked_up") && (
                    <>
                      {currentRide.status === "accepted" && (
                        <div className="status-alert status-alert--info">
                          ✅ <strong>Driver Accepted</strong> - Heading to pickup location
                        </div>
                      )}
                      {currentRide.status === "picked_up" && (
                        <div className="status-alert status-alert--success">
                          🚗 <strong>On the Way</strong> - Heading to your destination
                        </div>
                      )}

                      <div className="driver-header">
                        <div className="driver-name-rating">
                          <h4>👤 {currentRide.driver.name}</h4>
                          {currentRide.driver.average_rating > 0 && (
                            <div className="driver-rating">
                              <span>⭐</span>
                              <strong>{parseFloat(currentRide.driver.average_rating).toFixed(1)}</strong>
                              {currentRide.driver.total_ratings && (
                                <small>({currentRide.driver.total_ratings})</small>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {currentRide.driver.phone && (
                        <div className="driver-contact">
                          <div className="contact-label">📞 Contact</div>
                          <div className="contact-number">{currentRide.driver.phone}</div>
                          <a href={`tel:${currentRide.driver.phone.replace(/\s+/g, '')}`} className="call-button">
                            📞 Call Driver
                          </a>
                        </div>
                      )}

                      {(currentRide.driver.vehicle_type || currentRide.driver.plate_number) && (
                        <div className="vehicle-info">
                          <div className="info-label">🚗 Vehicle</div>
                          <div className="info-grid">
                            {currentRide.driver.vehicle_type && (
                              <div className="info-item">
                                <span className="info-key">Type:</span>
                                <span className="info-value">{currentRide.driver.vehicle_type}</span>
                              </div>
                            )}
                            {currentRide.driver.plate_number && (
                              <div className="info-item">
                                <span className="info-key">Plate:</span>
                                <span className="info-value plate-number">{currentRide.driver.plate_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {currentRide.driver.current_place && (
                        <div className="driver-location">
                          <div className="info-label">📍 Driver Location</div>
                          <div className="location-name">{currentRide.driver.current_place.name}</div>
                          {currentRide.driver.current_place.address && (
                            <div className="location-address">{currentRide.driver.current_place.address}</div>
                          )}
                          {currentRide.driver.distance_km && (
                            <div className="distance-badge">
                              📏 {parseFloat(currentRide.driver.distance_km).toFixed(1)} km away
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {!currentRide.driver && (
                <div className="no-driver-message">
                  <span>🔍 Searching for available driver...</span>
                </div>
              )}

              {/* Rating Form for Completed Rides */}
              {currentRide.status === "completed" && currentRide.driver && !currentRide.feedback && (
                <div style={{
                  marginTop: "1.5rem",
                  paddingTop: "1.5rem",
                  borderTop: "2px solid #10b981",
                  background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                  padding: "1.5rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #86efac"
                }}>
                  <FeedbackForm
                    token={token}
                    rideId={currentRide.id}
                    driverName={currentRide.driver.name}
                    onSuccess={() => {
                      setSuccess('Thank you for rating your driver!');
                      setTimeout(() => {
                        loadCurrentRide();
                        setSuccess('');
                      }, 2000);
                    }}
                    onSkip={() => {
                      // Allow skipping, but mark that feedback was skipped
                      setSuccess('Rating skipped. You can rate later from your ride history.');
                      setTimeout(() => setSuccess(''), 3000);
                    }}
                  />
                </div>
              )}

              {/* Cancel Button at Bottom */}
              {canCancelRide(currentRide) && (
                <div style={{
                  marginTop: "1.5rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid #e2e8f0"
                }}>
                  <button
                    onClick={handleCancelClick}
                    disabled={loadingRide}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      width: '100%',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      fontSize: '1rem',
                      cursor: loadingRide ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                      transition: 'all 0.3s ease',
                      opacity: loadingRide ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingRide) {
                        e.target.style.backgroundColor = '#dc2626';
                        e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingRide) {
                        e.target.style.backgroundColor = '#ef4444';
                        e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
                      }
                    }}
                  >
                    {loadingRide ? "Cancelling..." : "Cancel Ride"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="panel__empty">
              <p>You don't have an active ride right now.</p>
              <p className="text-muted">
                Use the "Book a Ride" form to request a tricycle ride.
              </p>
            </div>
          )}
        </article>
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
            {displayHistory.map((ride) => (
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
