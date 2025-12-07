import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { fetchCurrentPassengerRide, fetchPassengerHistory, cancelPassengerRide } from "../../services/passengerService";
import FeedbackForm from "../../components/FeedbackForm";
import "../../styles/dashboard.css";
import "../../styles/passenger-dashboard.css";

export default function ViewBooking() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [currentRide, setCurrentRide] = useState(null);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [rideForFeedback, setRideForFeedback] = useState(null);
  const [cancellingRideId, setCancellingRideId] = useState(null);

  const loadCurrentRide = useCallback(async () => {
    try {
      const data = await fetchCurrentPassengerRide(token);
      const rideData = data?.data || data;
      setCurrentRide(rideData || null);
    } catch (err) {
      if (err?.status === 404) {
        setCurrentRide(null);
      } else {
        setError(
          err?.message || err?.data?.message || "Unable to load booking"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadHistory = useCallback(
    async (nextPage = 1) => {
      setLoadingHistory(true);
      try {
        const data = await fetchPassengerHistory(token, nextPage);
        const historyData = Array.isArray(data) ? data : data?.data || [];
        setHistory(historyData);
        setPage(nextPage);
      } catch (err) {
        setError(
          err?.message || err?.data?.message || "Unable to load ride history"
        );
      } finally {
        setLoadingHistory(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) {
      loadCurrentRide();
      loadHistory();
      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        loadCurrentRide();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [token, loadCurrentRide, loadHistory]);

  if (!token) {
    return (
      <div className="dashboard">
        <div className="alert alert--error">
          Not authenticated. Please log in.
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard passenger-dashboard">
      <header className="dashboard__header" style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "1rem",
        alignItems: "center"
      }}>
        <div>
          <h2>My Booking</h2>
          <p>View your current ride details</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", justifyContent: "flex-end" }}>
          <button onClick={() => navigate("/passenger/dashboard")} className="secondary">
            Back to Dashboard
          </button>
          <button onClick={logout} className="secondary">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      {loading && (
        <section className="panel">
          <div className="panel__empty">
            <p>Loading booking details...</p>
          </div>
        </section>
      )}

      {!loading && !currentRide && (
        <section className="panel">
          <div className="panel__empty">
            <p>You don't have an active booking right now.</p>
            <p className="text-muted">
              Book a ride from the dashboard to see your booking details here.
            </p>
            <button
              onClick={() => navigate("/passenger/dashboard")}
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "var(--accent-primary, #3b82f6)",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </section>
      )}

      {!loading && currentRide && (
        <section className="panel" style={{ borderLeft: '4px solid var(--accent-primary, #3b82f6)' }}>
          <div className="panel__header">
            <div>
              <h3>My Current Booking</h3>
              <p className="panel__description">
                Your active ride details
              </p>
            </div>
            <button className="secondary" onClick={loadCurrentRide} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
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
                <dt>Drop-off Location</dt>
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
            {currentRide.notes && (
              <div>
                <dt>Notes</dt>
                <dd>{currentRide.notes}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {/* Booking History */}
      <section className="panel" style={{ marginTop: "1.5rem", borderLeft: '4px solid #8b5cf6' }}>
        <div className="panel__header">
          <div>
            <h3>Booking History</h3>
            <p className="panel__description">
              View all your past and completed rides
            </p>
          </div>
          <div>
            <button
              className="secondary"
              onClick={() => loadHistory(page - 1)}
              disabled={page <= 1 || loadingHistory}
            >
              Previous
            </button>
            <button 
              className="secondary" 
              onClick={() => loadHistory(page + 1)}
              disabled={loadingHistory}
            >
              Next
            </button>
          </div>
        </div>
        {loadingHistory && (
          <div className="panel__empty">
            <p>Loading history...</p>
          </div>
        )}
        {!loadingHistory && history.length === 0 ? (
          <div className="panel__empty">
            <p>You haven't taken any rides yet.</p>
            <p className="text-muted">
              Your ride history will appear here after you book your first ride.
            </p>
          </div>
        ) : (
          !loadingHistory && (
            <div className="table">
              <div className="table__head">
                <span>Ride #</span>
                <span>Ride Details</span>
                <span>Status</span>
                <span>Date</span>
                <span>Feedback</span>
                <span>Actions</span>
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
                      {!["completed", "cancelled"].includes(ride.status) &&
                        ride.status}
                    </span>
                  </span>
                  <span>
                    {ride.completed_at || ride.created_at
                      ? new Date(
                          ride.completed_at || ride.created_at
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </span>
                  <span>
                    {ride.status === "completed" && ride.driver && (
                      ride.feedback ? (
                        <span style={{ 
                          color: "#10b981", 
                          fontSize: "0.875rem",
                          fontWeight: "600"
                        }}>
                          COMPLETED
                        </span>
                      ) : (
                        <button
                          className="secondary"
                          onClick={() => {
                            setRideForFeedback(ride);
                            setShowFeedback(true);
                          }}
                          style={{
                            padding: "0.5rem 1rem",
                            fontSize: "0.875rem",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Rate Driver
                        </button>
                      )
                    )}
                    {ride.status !== "completed" && (
                      <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                        N/A
                      </span>
                    )}
                  </span>
                  <span>
                    {ride.status !== "completed" && ride.status !== "cancelled" && (
                      <button
                        className="secondary"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to cancel ride #${ride.id}?`)) {
                            setCancellingRideId(ride.id);
                            try {
                              await cancelPassengerRide(token, ride.id, "");
                              setSuccess("Ride cancelled successfully.");
                              setTimeout(() => {
                                loadHistory(page);
                                setSuccess("");
                              }, 2000);
                            } catch (err) {
                              setError(
                                err?.data?.message || err?.message || "Failed to cancel ride"
                              );
                            } finally {
                              setCancellingRideId(null);
                            }
                          }
                        }}
                        disabled={cancellingRideId === ride.id}
                        style={{
                          padding: "0.5rem 1rem",
                          fontSize: "0.875rem",
                          backgroundColor: cancellingRideId === ride.id ? "#94a3b8" : "#ef4444",
                          color: "white",
                          border: "none",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {cancellingRideId === ride.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                    {(ride.status === "completed" || ride.status === "cancelled") && (
                      <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                        -
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </section>

      {/* Feedback Form Modal */}
      {showFeedback && rideForFeedback && (
        <div
          style={{
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
              setShowFeedback(false);
              setRideForFeedback(null);
            }
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowFeedback(false);
                setRideForFeedback(null);
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#64748b',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f1f5f9';
                e.target.style.color = '#1e293b';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#64748b';
              }}
            >
              ×
            </button>
            <FeedbackForm
              token={token}
              rideId={rideForFeedback.id}
              driverName={rideForFeedback.driver?.name}
              onSuccess={() => {
                setShowFeedback(false);
                setRideForFeedback(null);
                setSuccess('Thank you for rating your driver!');
                setTimeout(() => {
                  loadHistory(page);
                  setSuccess('');
                }, 2000);
              }}
              onSkip={() => {
                setShowFeedback(false);
                setRideForFeedback(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

