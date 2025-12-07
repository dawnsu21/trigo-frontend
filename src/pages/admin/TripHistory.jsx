import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchAdminRides,
} from "../../services/adminService";
import "../../styles/dashboard.css";
import "../../styles/admin-dashboard.css";

export default function TripHistory() {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [allCompletedTrips, setAllCompletedTrips] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRides = useCallback(async () => {
    try {
      console.log("[TripHistory] Loading rides...");
      const data = await fetchAdminRides(token);
      const ridesList = Array.isArray(data) ? data : data?.data || [];
      setRides(ridesList);
      
      // Filter only completed trips
      const completed = ridesList.filter(
        (ride) => ride.status?.toLowerCase() === "completed"
      );
      setAllCompletedTrips(completed);
      setCompletedTrips(completed);
    } catch (err) {
      console.error("[TripHistory] Error loading rides:", err);
      setError(err?.message || err?.data?.message || "Unable to load rides");
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      setError("");
      loadRides()
        .then(() => {
          console.log("[TripHistory] Data loaded successfully");
          setLoading(false);
        })
        .catch((err) => {
          console.error("[TripHistory] Error loading data:", err);
          setLoading(false);
        });
    } else {
      console.warn("[TripHistory] No token available");
      setLoading(false);
    }
  }, [token, loadRides]);

  // Filter completed trips based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setCompletedTrips(allCompletedTrips);
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    // Filter trips
    const filteredTrips = allCompletedTrips.filter((ride) => {
      const passengerName = (ride.passenger?.name || "").toLowerCase();
      const driverName = (ride.driver?.name || "").toLowerCase();
      const pickup = (ride.pickup_place?.name || ride.pickup_address || "").toLowerCase();
      const dropoff = (ride.dropoff_place?.name || ride.dropoff_address || "").toLowerCase();
      const rideId = String(ride.id || "").toLowerCase();
      const fare = String(ride.fare || "").toLowerCase();

      return (
        passengerName.includes(query) ||
        driverName.includes(query) ||
        pickup.includes(query) ||
        dropoff.includes(query) ||
        rideId.includes(query) ||
        fare.includes(query)
      );
    });

    setCompletedTrips(filteredTrips);
  }, [searchQuery, allCompletedTrips]);

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
            <h2>Trip History</h2>
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
        <div className="alert">Loading trip history...</div>
      </div>
    );
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
          <h2>Trip History</h2>
          <p>View all completed trips with detailed information</p>
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
              placeholder="Search trips by passenger, driver, location, ride ID, or fare..."
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
              {completedTrips.length} result{completedTrips.length !== 1 ? 's' : ''}
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

      {/* Trip History Table */}
      <section className="panel" style={{ borderLeft: '5px solid #06b6d4', background: 'linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)' }}>
        <div className="panel__header">
          <div>
            <h3>🚗 Trip History View</h3>
            <p className="panel__description">
              View all completed trips with detailed information
            </p>
          </div>
          <button className="secondary" onClick={loadRides}>
            Refresh List
          </button>
        </div>
        {completedTrips.length === 0 && (
          <div className="panel__empty">
            <p>No completed trips found.</p>
            {searchQuery && (
              <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                Try adjusting your search query.
              </p>
            )}
          </div>
        )}
        {completedTrips.length > 0 && (
          <div className="table">
            <div className="table__head" style={{ gridTemplateColumns: "80px 1.5fr 1.2fr 1.2fr 1fr" }}>
              <span>Trip #</span>
              <span>Passenger Name</span>
              <span>Pickup Location</span>
              <span>Drop-off Location</span>
              <span>Driver Assigned</span>
            </div>
            {completedTrips.map((ride) => (
              <div 
                className="table__row" 
                key={ride.id}
                style={{ gridTemplateColumns: "80px 1.5fr 1.2fr 1.2fr 1fr" }}
              >
                <span>
                  <strong>#{ride.id}</strong>
                </span>
                <span>
                  {ride.passenger ? (
                    <>
                      <strong>{ride.passenger.name || "Unknown"}</strong>
                      {ride.passenger.email && (
                        <>
                          <br />
                          <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {ride.passenger.email}
                          </small>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-muted">Unknown Passenger</span>
                  )}
                </span>
                <span>
                  <div style={{ fontSize: "0.875rem" }}>
                    <strong>{ride.pickup_place?.name || ride.pickup_address || "N/A"}</strong>
                  </div>
                  {ride.pickup_place?.address && (
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                      {ride.pickup_place.address}
                    </div>
                  )}
                  {(ride.pickup_lat && ride.pickup_lng && !ride.pickup_place && !ride.pickup_address) && (
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                      Coordinates: {ride.pickup_lat.toFixed(4)}, {ride.pickup_lng.toFixed(4)}
                    </div>
                  )}
                </span>
                <span>
                  <div style={{ fontSize: "0.875rem" }}>
                    <strong>{ride.dropoff_place?.name || ride.dropoff_address || "N/A"}</strong>
                  </div>
                  {ride.dropoff_place?.address && (
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                      {ride.dropoff_place.address}
                    </div>
                  )}
                  {(ride.drop_lat && ride.drop_lng && !ride.dropoff_place && !ride.dropoff_address) && (
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                      Coordinates: {ride.drop_lat.toFixed(4)}, {ride.drop_lng.toFixed(4)}
                    </div>
                  )}
                </span>
                <span>
                  {ride.driver ? (
                    <>
                      <strong>{ride.driver.name || "Unknown Driver"}</strong>
                      {ride.driver.vehicle_type && (
                        <>
                          <br />
                          <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {ride.driver.vehicle_type}
                          </small>
                        </>
                      )}
                      {ride.driver.plate_number && (
                        <>
                          <br />
                          <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                            Plate: {ride.driver.plate_number}
                          </small>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-muted">Unassigned</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

