import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { fetchDriverHistory } from "../../services/driverService";
import "../../styles/dashboard.css";
import "../../styles/driver-dashboard.css";

export default function DriverTripHistory() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [allHistory, setAllHistory] = useState([]);

  const loadHistory = useCallback(
    async (page = 1) => {
      if (!token) return;
      try {
        setLoading(true);
        setError("");
        const data = await fetchDriverHistory(token, page);
        const rides = Array.isArray(data) ? data : data?.data || [];
        setHistory(rides);
        setHistoryPage(page);
        
        // Load all history for search (if not already loaded)
        if (page === 1 && allHistory.length === 0) {
          // Try to load more pages to get all history for search
          let allRides = [...rides];
          let currentPage = 1;
          while (rides.length > 0) {
            currentPage++;
            try {
              const nextData = await fetchDriverHistory(token, currentPage);
              const nextRides = Array.isArray(nextData) ? nextData : nextData?.data || [];
              if (nextRides.length === 0) break;
              allRides = [...allRides, ...nextRides];
            } catch (err) {
              break;
            }
          }
          setAllHistory(allRides);
        }
      } catch (err) {
        console.error("[DriverTripHistory] Error loading history:", err);
        setError(
          err?.message || err?.data?.message || "Unable to load trip history"
        );
      } finally {
        setLoading(false);
      }
    },
    [token, allHistory.length]
  );

  useEffect(() => {
    if (token) {
      loadHistory(1);
    }
  }, [token, loadHistory]);

  // Filter history based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      return; // Use paginated history when no search
    }

    const query = searchQuery.toLowerCase().trim();
    const searchableHistory = allHistory.length > 0 ? allHistory : history;

    const filtered = searchableHistory.filter((ride) => {
      const passengerName = (ride.passenger?.name || "").toLowerCase();
      const passengerPhone = (ride.passenger?.phone || "").toLowerCase();
      const pickup = (ride.pickup_place?.name || ride.pickup_address || "").toLowerCase();
      const dropoff = (ride.dropoff_place?.name || ride.dropoff_address || "").toLowerCase();
      const rideId = String(ride.id || "").toLowerCase();
      const rating = String(ride.feedback?.rating || ride.rating || "").toLowerCase();
      const status = (ride.status || "").toLowerCase();

      return (
        passengerName.includes(query) ||
        passengerPhone.includes(query) ||
        pickup.includes(query) ||
        dropoff.includes(query) ||
        rideId.includes(query) ||
        rating.includes(query) ||
        status.includes(query)
      );
    });

    setHistory(filtered);
  }, [searchQuery, allHistory, history]);

  if (!token) {
    return (
      <div className="dashboard">
        <div className="alert alert--error">
          Not authenticated. Please log in.
        </div>
      </div>
    );
  }

  const displayHistory = searchQuery.trim() ? history : history;

  return (
    <div className="dashboard driver-dashboard">
      <header className="dashboard__header" style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr auto 1fr",
        gap: "1rem",
        alignItems: "center"
      }}>
        <div>
          <h2>📋 Trip History</h2>
          <p>View all your completed and past rides</p>
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
              placeholder="Search trips by passenger, location, ride ID, or rating..."
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
              {displayHistory.length} result{displayHistory.length !== 1 ? 's' : ''}
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

      {/* Trip History Table */}
      <section className="panel" style={{ borderLeft: '5px solid #10b981', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
        <div className="panel__header">
          <div>
            <h3>🚗 All Trip History</h3>
            <p className="panel__description">
              Complete list of all your completed and past rides
            </p>
          </div>
          <button className="secondary" onClick={() => loadHistory(historyPage)}>
            Refresh List
          </button>
        </div>

        {loading && (
          <div className="panel__empty">
            <p>Loading trip history...</p>
          </div>
        )}

        {!loading && displayHistory.length === 0 && (
          <div className="panel__empty">
            <p>No trip history yet.</p>
            {searchQuery && (
              <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                Try adjusting your search query.
              </p>
            )}
            {!searchQuery && (
              <p className="text-muted">
                Your completed rides will appear here.
              </p>
            )}
          </div>
        )}

        {!loading && displayHistory.length > 0 && (
          <>
            <div className="table">
              <div className="table__head">
                <span>Ride #</span>
                <span>Passenger</span>
                <span>Route</span>
                <span>Status</span>
                <span>Date</span>
                <span>Rating</span>
              </div>
              {displayHistory.map((ride) => {
                const rating = ride.feedback?.rating || ride.rating || null;
                return (
                  <div className="table__row" key={ride.id}>
                    <span>#{ride.id}</span>
                    <span>
                      {ride.passenger ? (
                        <>
                          <strong>{ride.passenger.name}</strong>
                          {ride.passenger.phone && (
                            <>
                              <br />
                              <small className="text-muted">
                                {ride.passenger.phone}
                              </small>
                            </>
                          )}
                        </>
                      ) : (
                        <span className="text-muted">Unknown</span>
                      )}
                    </span>
                    <span>
                      {(ride.pickup_place || ride.pickup_address) && (
                        <div style={{ fontSize: "0.875rem" }}>
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
                      {rating ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          justifyContent: 'flex-end'
                        }}>
                          <span style={{ fontSize: '1.25rem' }}>⭐</span>
                          <span style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: rating >= 4 ? '#059669' : rating >= 3 ? '#d97706' : '#dc2626'
                          }}>
                            {parseFloat(rating).toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                          No rating
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            {!searchQuery && (
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "center",
                  marginTop: "1rem",
                }}
              >
                <button
                  className="secondary"
                  onClick={() => loadHistory(historyPage - 1)}
                  disabled={historyPage <= 1 || loading}
                >
                  Previous
                </button>
                <button
                  className="secondary"
                  onClick={() => loadHistory(historyPage + 1)}
                  disabled={loading}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

