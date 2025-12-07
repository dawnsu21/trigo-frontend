import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { fetchDriverHistory } from "../../services/driverService";
import "../../styles/dashboard.css";
import "../../styles/driver-dashboard.css";

export default function DriverFeedbacks() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allFeedbacks, setAllFeedbacks] = useState([]);

  const loadFeedbacks = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      
      // Load all history pages to get all completed rides with feedbacks
      let allRides = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        try {
          const data = await fetchDriverHistory(token, currentPage);
          const rides = Array.isArray(data) ? data : data?.data || [];
          
          if (rides.length === 0) {
            hasMore = false;
            break;
          }
          
          allRides = [...allRides, ...rides];
          currentPage++;
          
          // Safety limit to prevent infinite loops
          if (currentPage > 100) {
            hasMore = false;
            break;
          }
        } catch (err) {
          hasMore = false;
          break;
        }
      }

      // Filter only completed rides that have any feedback (passenger-to-driver or driver-to-passenger)
      const ridesWithFeedback = allRides.filter(ride => {
        const isCompleted = ride.status?.toLowerCase() === 'completed';
        // Check for passenger feedback (passenger rated driver)
        const hasPassengerFeedback = ride.feedback || ride.rating || ride.comment;
        // Check for driver feedback (driver rated passenger) - might be in different fields
        const hasDriverFeedback = ride.driver_feedback || ride.driver_rating || ride.driver_comment || 
                                  ride.passenger_feedback || ride.passenger_rating || ride.passenger_comment;
        return isCompleted && (hasPassengerFeedback || hasDriverFeedback);
      });

      // Sort by most recent first
      ridesWithFeedback.sort((a, b) => {
        const dateA = new Date(a.completed_at || a.created_at || 0);
        const dateB = new Date(b.completed_at || b.created_at || 0);
        return dateB - dateA;
      });

      setFeedbacks(ridesWithFeedback);
      setAllFeedbacks(ridesWithFeedback);
    } catch (err) {
      console.error("[DriverFeedbacks] Error loading feedbacks:", err);
      setError(
        err?.message || err?.data?.message || "Unable to load feedbacks"
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadFeedbacks();
    }
  }, [token, loadFeedbacks]);

  // Filter feedbacks based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFeedbacks(allFeedbacks);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = allFeedbacks.filter((feedback) => {
      const passengerName = (feedback.passenger?.name || "").toLowerCase();
      const passengerPhone = (feedback.passenger?.phone || "").toLowerCase();
      const rideId = String(feedback.id || "").toLowerCase();
      // Passenger feedback (passenger to driver)
      const passengerComment = (feedback.feedback?.comment || feedback.comment || "").toLowerCase();
      const passengerRating = String(feedback.feedback?.rating || feedback.rating || "").toLowerCase();
      // Driver feedback (driver to passenger)
      const driverComment = (feedback.driver_feedback?.comment || feedback.driver_comment || 
                            feedback.passenger_feedback?.comment || feedback.passenger_comment || "").toLowerCase();
      const driverRating = String(feedback.driver_feedback?.rating || feedback.driver_rating || 
                                  feedback.passenger_feedback?.rating || feedback.passenger_rating || "").toLowerCase();

      return (
        passengerName.includes(query) ||
        passengerPhone.includes(query) ||
        rideId.includes(query) ||
        passengerComment.includes(query) ||
        passengerRating.includes(query) ||
        driverComment.includes(query) ||
        driverRating.includes(query)
      );
    });

    setFeedbacks(filtered);
  }, [searchQuery, allFeedbacks]);

  if (!token) {
    return (
      <div className="dashboard">
        <div className="alert alert--error">
          Not authenticated. Please log in.
        </div>
      </div>
    );
  }

  // Calculate average ratings
  const passengerRatings = allFeedbacks
    .map(f => f.feedback?.rating || f.rating || null)
    .filter(r => r !== null && r > 0);
  const driverRatings = allFeedbacks
    .map(f => f.driver_feedback?.rating || f.driver_rating || f.passenger_feedback?.rating || f.passenger_rating || null)
    .filter(r => r !== null && r > 0);
  
  const averagePassengerRating = passengerRatings.length > 0
    ? passengerRatings.reduce((sum, r) => sum + parseFloat(r), 0) / passengerRatings.length
    : 0;
  const averageDriverRating = driverRatings.length > 0
    ? driverRatings.reduce((sum, r) => sum + parseFloat(r), 0) / driverRatings.length
    : 0;

  return (
    <div className="dashboard driver-dashboard">
      <header className="dashboard__header" style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr auto 1fr",
        gap: "1rem",
        alignItems: "center"
      }}>
          <div>
            <h2>⭐ All Feedbacks</h2>
            <p>View all ratings and feedbacks - from passengers to you and from you to passengers</p>
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
              placeholder="Search feedbacks by passenger, ride ID, or comment..."
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
              {feedbacks.length} result{feedbacks.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div style={{ 
          display: "flex", 
          gap: "0.75rem", 
          alignItems: "center",
          justifyContent: "flex-end"
        }}>
          <button onClick={() => navigate("/driver/dashboard")} className="secondary">
            Back to Dashboard
          </button>
          <button onClick={logout} className="secondary">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      {/* Statistics Card */}
      {!loading && allFeedbacks.length > 0 && (
        <section className="panel" style={{ 
          borderLeft: '5px solid #f59e0b', 
          background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
          marginBottom: '1.5rem'
        }}>
          <div className="panel__header">
            <h3>📊 Feedback Statistics</h3>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1.5rem',
            marginTop: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Total Feedbacks
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
                {allFeedbacks.length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Avg. Rating (Passengers → You)
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
                {averagePassengerRating > 0 ? averagePassengerRating.toFixed(1) : '0.0'}
                <span style={{ fontSize: '1rem', marginLeft: '0.25rem' }}>⭐</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Avg. Rating (You → Passengers)
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
                {averageDriverRating > 0 ? averageDriverRating.toFixed(1) : '0.0'}
                <span style={{ fontSize: '1rem', marginLeft: '0.25rem' }}>⭐</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Feedbacks List */}
      <section className="panel" style={{ borderLeft: '5px solid #8b5cf6', background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)' }}>
        <div className="panel__header">
          <div>
            <h3>💬 All Feedbacks</h3>
            <p className="panel__description">
              Ratings and comments - both from passengers to you and from you to passengers
            </p>
          </div>
          <button className="secondary" onClick={loadFeedbacks} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading && (
          <div className="panel__empty">
            <p>Loading feedbacks...</p>
          </div>
        )}

        {!loading && feedbacks.length === 0 && (
          <div className="panel__empty">
            <p>No feedbacks yet.</p>
            {searchQuery && (
              <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                Try adjusting your search query.
              </p>
            )}
            {!searchQuery && (
              <p className="text-muted">
                Feedbacks will appear here after completed rides - both passenger ratings of you and your ratings of passengers.
              </p>
            )}
          </div>
        )}

        {!loading && feedbacks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {feedbacks.map((feedback) => {
              // Passenger feedback (passenger to driver)
              const passengerRating = feedback.feedback?.rating || feedback.rating || null;
              const passengerComment = feedback.feedback?.comment || feedback.comment || '';
              
              // Driver feedback (driver to passenger)
              const driverRating = feedback.driver_feedback?.rating || feedback.driver_rating || 
                                 feedback.passenger_feedback?.rating || feedback.passenger_rating || null;
              const driverComment = feedback.driver_feedback?.comment || feedback.driver_comment || 
                                  feedback.passenger_feedback?.comment || feedback.passenger_comment || '';
              
              const passengerName = feedback.passenger?.name || 'Unknown Passenger';
              const passengerPhone = feedback.passenger?.phone || '';
              
              const hasPassengerFeedback = passengerRating !== null || passengerComment;
              const hasDriverFeedback = driverRating !== null || driverComment;
              
              return (
                <div
                  key={feedback.id}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem',
                        marginBottom: '0.5rem'
                      }}>
                        <h4 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                          {passengerName}
                        </h4>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          color: '#475569',
                          fontWeight: '600'
                        }}>
                          Ride #{feedback.id}
                        </span>
                      </div>
                      {passengerPhone && (
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          📞 {passengerPhone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Passenger Feedback (Passenger → Driver) */}
                  {hasPassengerFeedback && (
                    <div style={{
                      marginBottom: hasDriverFeedback ? '1.5rem' : '0',
                      padding: '1rem',
                      backgroundColor: '#eff6ff',
                      borderRadius: '0.5rem',
                      border: '1px solid #bfdbfe',
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem',
                        marginBottom: '0.75rem'
                      }}>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          color: '#1e40af', 
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}>
                          📥 Passenger Feedback (To You)
                        </span>
                        {passengerRating !== null && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0.75rem',
                            backgroundColor: passengerRating >= 4 ? '#dcfce7' : passengerRating >= 3 ? '#fef3c7' : '#fee2e2',
                            borderRadius: '0.5rem',
                            border: `1px solid ${passengerRating >= 4 ? '#86efac' : passengerRating >= 3 ? '#fbbf24' : '#fca5a5'}`,
                          }}>
                            <span style={{ fontSize: '1.25rem' }}>⭐</span>
                            <span style={{ 
                              fontSize: '1rem', 
                              fontWeight: '700',
                              color: passengerRating >= 4 ? '#059669' : passengerRating >= 3 ? '#d97706' : '#dc2626'
                            }}>
                              {parseFloat(passengerRating).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      {passengerComment && (
                        <div style={{ 
                          color: '#0f172a',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.9375rem'
                        }}>
                          {passengerComment}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Driver Feedback (Driver → Passenger) */}
                  {hasDriverFeedback && (
                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '0.5rem',
                      border: '1px solid #86efac',
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem',
                        marginBottom: '0.75rem'
                      }}>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          color: '#059669', 
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}>
                          📤 Your Feedback (To Passenger)
                        </span>
                        {driverRating !== null && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0.75rem',
                            backgroundColor: driverRating >= 4 ? '#dcfce7' : driverRating >= 3 ? '#fef3c7' : '#fee2e2',
                            borderRadius: '0.5rem',
                            border: `1px solid ${driverRating >= 4 ? '#86efac' : driverRating >= 3 ? '#fbbf24' : '#fca5a5'}`,
                          }}>
                            <span style={{ fontSize: '1.25rem' }}>⭐</span>
                            <span style={{ 
                              fontSize: '1rem', 
                              fontWeight: '700',
                              color: driverRating >= 4 ? '#059669' : driverRating >= 3 ? '#d97706' : '#dc2626'
                            }}>
                              {parseFloat(driverRating).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      {driverComment && (
                        <div style={{ 
                          color: '#0f172a',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.9375rem'
                        }}>
                          {driverComment}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ 
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    color: '#64748b'
                  }}>
                    <div>
                      <strong>Route:</strong>{' '}
                      {feedback.pickup_place?.name || feedback.pickup_address || 'N/A'}
                      {' → '}
                      {feedback.dropoff_place?.name || feedback.dropoff_address || 'N/A'}
                    </div>
                    <div>
                      {feedback.completed_at || feedback.created_at
                        ? new Date(
                            feedback.completed_at || feedback.created_at
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

