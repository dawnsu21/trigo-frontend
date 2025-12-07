import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchAdminRides,
} from "../../services/adminService";
import { fetchEmergencies } from "../../services/emergencyService";
import "../../styles/dashboard.css";
import "../../styles/admin-dashboard.css";

export default function PassengerFeedbacks() {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [allEmergencies, setAllEmergencies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(false);

  const loadFeedbacks = useCallback(async () => {
    try {
      console.log("[PassengerFeedbacks] Loading feedbacks...");
      // Since /api/admin/feedbacks doesn't exist, extract feedbacks from rides
      const ridesData = await fetchAdminRides(token);
      const rides = Array.isArray(ridesData) ? ridesData : ridesData?.data || [];
      
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
          type: 'feedback',
        }))
        .filter(feedback => feedback.rating !== null); // Only include feedbacks with ratings
      
      console.log("[PassengerFeedbacks] Feedbacks extracted from rides:", feedbacksList);
      setAllFeedbacks(feedbacksList);
      setFeedbacks(feedbacksList);
    } catch (err) {
      console.error("[PassengerFeedbacks] Error loading feedbacks:", err);
      setError(err?.message || err?.data?.message || "Unable to load feedbacks from rides");
      setAllFeedbacks([]);
      setFeedbacks([]);
    }
  }, [token]);

  const loadEmergencies = useCallback(async () => {
    try {
      console.log("[PassengerFeedbacks] Loading emergencies...");
      const data = await fetchEmergencies(token);
      const emergenciesList = Array.isArray(data) ? data : data?.data || [];
      
      // Map emergencies to feedback-like format for display
      const mappedEmergencies = emergenciesList.map(emergency => ({
        id: emergency.id,
        ride_id: emergency.ride_id || null,
        type: 'emergency',
        emergency_type: emergency.type,
        title: emergency.title,
        comment: emergency.description,
        status: emergency.status,
        created_at: emergency.created_at || emergency.created_at,
        passenger: emergency.passenger || emergency.user || null,
        ride: emergency.ride || null,
        rating: null, // Emergencies don't have ratings
      }));
      
      console.log("[PassengerFeedbacks] Emergencies loaded:", mappedEmergencies);
      setAllEmergencies(mappedEmergencies);
      setEmergencies(mappedEmergencies);
    } catch (err) {
      console.error("[PassengerFeedbacks] Error loading emergencies:", err);
      // Don't set error for emergencies, just log it
      setAllEmergencies([]);
      setEmergencies([]);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      setError("");
      Promise.all([loadFeedbacks(), loadEmergencies()])
        .then(() => {
          console.log("[PassengerFeedbacks] Data loaded successfully");
          setLoading(false);
        })
        .catch((err) => {
          console.error("[PassengerFeedbacks] Error loading data:", err);
          setLoading(false);
        });
    } else {
      console.warn("[PassengerFeedbacks] No token available");
      setLoading(false);
    }
  }, [token, loadFeedbacks, loadEmergencies]);

  // Filter feedbacks and emergencies based on search query
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();

    // Filter feedbacks
    const filteredFeedbacks = allFeedbacks.filter((feedback) => {
      const passengerName = (feedback.passenger?.name || feedback.ride?.passenger?.name || "").toLowerCase();
      const comment = (feedback.comment || "").toLowerCase();
      const rideId = String(feedback.ride_id || "").toLowerCase();
      const rating = String(feedback.rating || "").toLowerCase();

      return (
        passengerName.includes(query) ||
        comment.includes(query) ||
        rideId.includes(query) ||
        rating.includes(query)
      );
    });

    // Filter emergencies
    const filteredEmergencies = allEmergencies.filter((emergency) => {
      const passengerName = (emergency.passenger?.name || emergency.ride?.passenger?.name || "").toLowerCase();
      const title = (emergency.title || "").toLowerCase();
      const comment = (emergency.comment || "").toLowerCase();
      const rideId = String(emergency.ride_id || "").toLowerCase();
      const type = (emergency.emergency_type || "").toLowerCase();

      return (
        passengerName.includes(query) ||
        title.includes(query) ||
        comment.includes(query) ||
        rideId.includes(query) ||
        type.includes(query)
      );
    });

    setFeedbacks(filteredFeedbacks);
    setEmergencies(filteredEmergencies);
  }, [searchQuery, allFeedbacks, allEmergencies]);

  if (!token) {
    return (
      <div className="dashboard">
        <div className="alert alert--error">
          Not authenticated. Please log in.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard">
        <header className="dashboard__header">
          <div>
            <h2>Passenger Feedbacks</h2>
            <p>Loading...</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button onClick={() => navigate("/admin/dashboard")} className="secondary">
              Back to Dashboard
            </button>
            <button onClick={logout} className="secondary">
              Logout
            </button>
          </div>
        </header>
        <div className="alert">Loading passenger feedbacks...</div>
      </div>
    );
  }

  const getRatingStars = (rating) => {
    return '⭐'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0))
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="dashboard admin-dashboard">
      <header className="dashboard__header" style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr auto 1fr",
        gap: "1rem",
        alignItems: "center"
      }}>
        <div>
          <h2>Passenger Feedbacks</h2>
          <p>View and manage all passenger feedbacks</p>
          {user && <p>Welcome, {user.name || user.email}</p>}
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
              placeholder="Search feedbacks by passenger name, comment, ride ID, or rating..."
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
              {feedbacks.length + emergencies.length} result{(feedbacks.length + emergencies.length) !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div style={{ 
          display: "flex", 
          gap: "0.75rem", 
          alignItems: "center",
          justifyContent: "flex-end"
        }}>
          <button onClick={() => navigate("/admin/dashboard")} className="secondary">
            Back to Dashboard
          </button>
          <button onClick={logout} className="secondary">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      {/* Passenger Feedbacks Table */}
      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>⭐ Passenger Feedbacks & Emergency Reports</h3>
            <p className="panel__description">
              All passenger feedbacks, ratings, and emergency reports
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              className={showEmergencies ? "" : "secondary"} 
              onClick={() => setShowEmergencies(!showEmergencies)}
            >
              {showEmergencies ? "Hide" : "Show"} Emergencies
            </button>
            <button className="secondary" onClick={() => {
              loadFeedbacks();
              loadEmergencies();
            }}>
              Refresh List
            </button>
          </div>
        </div>
        {feedbacks.length === 0 && (
          <div className="panel__empty">
            <p>No feedbacks found.</p>
            {searchQuery && (
              <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                Try adjusting your search query.
              </p>
            )}
            {!searchQuery && (
              <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                Passenger feedbacks will appear here once they submit feedback for completed rides.
              </p>
            )}
          </div>
        )}
        {feedbacks.length > 0 && (
          <div className="table">
            <div className="table__head" style={{ gridTemplateColumns: "80px 1.5fr 1.2fr 1.5fr 1fr" }}>
              <span>Ride #</span>
              <span>Passenger</span>
              <span>Rating</span>
              <span>Comment</span>
              <span>Date</span>
            </div>
            {feedbacks.map((feedback) => (
              <div 
                className="table__row" 
                key={feedback.id}
                style={{ gridTemplateColumns: "80px 1.5fr 1.2fr 1.5fr 1fr" }}
              >
                <span>
                  <strong>#{feedback.ride_id || "N/A"}</strong>
                </span>
                <span>
                  <strong>{feedback.passenger?.name || feedback.ride?.passenger?.name || "Anonymous"}</strong>
                  {feedback.passenger?.email && (
                    <>
                      <br />
                      <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {feedback.passenger.email}
                      </small>
                    </>
                  )}
                </span>
                <span>
                  <div style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                    {getRatingStars(feedback.rating)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    ({feedback.rating || 0}/5)
                  </div>
                </span>
                <span style={{ fontSize: "0.875rem" }}>
                  {feedback.comment || (
                    <span className="text-muted" style={{ fontStyle: "italic" }}>
                      No comment provided
                    </span>
                  )}
                </span>
                <span style={{ fontSize: "0.875rem" }}>
                  {formatDate(feedback.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Emergency Reports Section */}
      {showEmergencies && (
        <section className="panel" style={{ marginTop: "1.5rem", borderLeft: '5px solid #ef4444', background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)' }}>
          <div className="panel__header">
            <div>
              <h3>🚨 Emergency Reports</h3>
              <p className="panel__description">
                All passenger emergency reports and safety concerns
              </p>
            </div>
            <button className="secondary" onClick={loadEmergencies}>
              Refresh Emergencies
            </button>
          </div>
          {emergencies.length === 0 && (
            <div className="panel__empty">
              <p>No emergency reports found.</p>
              {searchQuery && (
                <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                  Try adjusting your search query.
                </p>
              )}
            </div>
          )}
          {emergencies.length > 0 && (
            <div className="table">
              <div className="table__head" style={{ gridTemplateColumns: "80px 1.5fr 1.2fr 1.5fr 1fr 1fr" }}>
                <span>Ride #</span>
                <span>Passenger</span>
                <span>Type</span>
                <span>Title & Description</span>
                <span>Status</span>
                <span>Date</span>
              </div>
              {emergencies.map((emergency) => (
                <div 
                  className="table__row" 
                  key={`emergency-${emergency.id}`}
                  style={{ gridTemplateColumns: "80px 1.5fr 1.2fr 1.5fr 1fr 1fr" }}
                >
                  <span>
                    <strong>{emergency.ride_id ? `#${emergency.ride_id}` : "N/A"}</strong>
                  </span>
                  <span>
                    {emergency.passenger ? (
                      <>
                        <strong>{emergency.passenger.name || "Unknown"}</strong>
                        {emergency.passenger.email && (
                          <>
                            <br />
                            <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                              {emergency.passenger.email}
                            </small>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-muted">Anonymous</span>
                    )}
                  </span>
                  <span>
                    <span style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.75rem",
                      backgroundColor: emergency.emergency_type === "accident" ? "#fee2e2" : 
                                       emergency.emergency_type === "safety_concern" ? "#fef3c7" : "#dbeafe",
                      color: emergency.emergency_type === "accident" ? "#991b1b" : 
                             emergency.emergency_type === "safety_concern" ? "#92400e" : "#1e40af",
                    }}>
                      {emergency.emergency_type === "safety_concern" && "⚠️ Safety"}
                      {emergency.emergency_type === "passenger_emergency" && "🚨 Passenger"}
                      {emergency.emergency_type === "accident" && "💥 Accident"}
                      {emergency.emergency_type === "other" && "📋 Other"}
                      {!["safety_concern", "passenger_emergency", "accident", "other"].includes(emergency.emergency_type) && emergency.emergency_type}
                    </span>
                  </span>
                  <span style={{ fontSize: "0.875rem" }}>
                    <strong>{emergency.title || "No title"}</strong>
                    {emergency.comment && (
                      <>
                        <br />
                        <div style={{ marginTop: "0.25rem", color: "#64748b" }}>
                          {emergency.comment.length > 100 
                            ? `${emergency.comment.substring(0, 100)}...` 
                            : emergency.comment}
                        </div>
                      </>
                    )}
                  </span>
                  <span>
                    <span className={`status status--${emergency.status?.toLowerCase() || "pending"}`}>
                      {emergency.status === "pending" && "⏳ Pending"}
                      {emergency.status === "acknowledged" && "✅ Acknowledged"}
                      {emergency.status === "resolved" && "✓ Resolved"}
                      {!["pending", "acknowledged", "resolved"].includes(emergency.status) && emergency.status}
                    </span>
                  </span>
                  <span style={{ fontSize: "0.875rem" }}>
                    {formatDate(emergency.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

