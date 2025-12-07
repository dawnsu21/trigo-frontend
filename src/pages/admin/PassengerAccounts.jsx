import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchAdminRides,
} from "../../services/adminService";
import "../../styles/dashboard.css";
import "../../styles/admin-dashboard.css";

export default function PassengerAccounts() {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState([]);
  const [allPassengers, setAllPassengers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPassengers = useCallback(async () => {
    try {
      console.log("[PassengerAccounts] Loading passengers...");
      // Extract unique passengers from rides
      const ridesData = await fetchAdminRides(token);
      const rides = Array.isArray(ridesData) ? ridesData : ridesData?.data || [];
      
      // Extract unique passengers from rides
      const passengerMap = new Map();
      rides.forEach((ride) => {
        if (ride.passenger) {
          const passengerId = ride.passenger.id || ride.passenger.user_id || ride.passenger_id;
          if (passengerId && !passengerMap.has(passengerId)) {
            passengerMap.set(passengerId, {
              id: passengerId,
              user_id: passengerId,
              name: ride.passenger.name,
              email: ride.passenger.email,
              phone: ride.passenger.phone,
              created_at: ride.passenger.created_at || ride.created_at,
              user: ride.passenger.user || {
                name: ride.passenger.name,
                email: ride.passenger.email,
                phone: ride.passenger.phone,
                created_at: ride.passenger.created_at || ride.created_at,
              },
            });
          }
        }
      });
      
      const uniquePassengers = Array.from(passengerMap.values());
      console.log("[PassengerAccounts] Passengers extracted from rides:", uniquePassengers);
      setAllPassengers(uniquePassengers);
      setPassengers(uniquePassengers);
    } catch (err) {
      console.error("[PassengerAccounts] Error loading passengers:", err);
      setError(err?.message || err?.data?.message || "Unable to load passengers");
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      setError("");
      loadPassengers()
        .then(() => {
          console.log("[PassengerAccounts] Data loaded successfully");
          setLoading(false);
        })
        .catch((err) => {
          console.error("[PassengerAccounts] Error loading data:", err);
          setLoading(false);
        });
    } else {
      console.warn("[PassengerAccounts] No token available");
      setLoading(false);
    }
  }, [token, loadPassengers]);

  // Filter passengers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setPassengers(allPassengers);
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    // Filter passengers
    const filteredPassengers = allPassengers.filter((passenger) => {
      const name = (passenger.name || passenger.user?.name || "").toLowerCase();
      const email = (passenger.email || passenger.user?.email || "").toLowerCase();
      const phone = (passenger.phone || passenger.user?.phone || "").toLowerCase();
      const id = String(passenger.id || passenger.user_id || "").toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        id.includes(query)
      );
    });

    setPassengers(filteredPassengers);
  }, [searchQuery, allPassengers]);

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
            <h2>Passenger Accounts</h2>
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
        <div className="alert">Loading passenger accounts...</div>
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
          <h2>Passenger Accounts</h2>
          <p>View and manage all passenger accounts</p>
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
              placeholder="Search passengers by name, email, phone, or ID..."
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
              {passengers.length} result{passengers.length !== 1 ? 's' : ''}
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

      {/* Passenger Accounts Table */}
      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Passenger Accounts</h3>
            <p className="panel__description">
              All registered passenger accounts and their information
            </p>
          </div>
          <button className="secondary" onClick={loadPassengers}>
            Refresh List
          </button>
        </div>
        {passengers.length === 0 && (
          <div className="panel__empty">
            <p>No passenger accounts found.</p>
            {searchQuery && (
              <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                Try adjusting your search query.
              </p>
            )}
            {!searchQuery && (
              <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                Note: Only passengers who have booked at least one ride are shown here.
              </p>
            )}
          </div>
        )}
        {passengers.length > 0 && (
          <div className="table">
            <div className="table__head" style={{ gridTemplateColumns: "80px 1.5fr 1.8fr 1.2fr 1.2fr 1fr" }}>
              <span>ID</span>
              <span>Full Name</span>
              <span>Email Address</span>
              <span>Phone Number</span>
              <span>Date Registered</span>
              <span>Notification</span>
            </div>
            {passengers.map((passenger) => (
              <div 
                className="table__row" 
                key={passenger.id || passenger.user_id}
                style={{ gridTemplateColumns: "80px 1.5fr 1.8fr 1.2fr 1.2fr 1fr" }}
              >
                <span>
                  <strong>#{passenger.id || passenger.user_id || "N/A"}</strong>
                </span>
                <span>
                  <strong>{passenger.name || passenger.user?.name || "Unknown"}</strong>
                </span>
                <span>
                  {passenger.email || passenger.user?.email || "Not provided"}
                </span>
                <span>
                  {passenger.phone || passenger.user?.phone || "Not provided"}
                </span>
                <span>
                  {passenger.created_at || passenger.user?.created_at
                    ? new Date(passenger.created_at || passenger.user?.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A"}
                </span>
                <span>
                  <button
                    className="secondary"
                    onClick={() => {
                      // TODO: Implement notification/message functionality
                      const passengerEmail = passenger.email || passenger.user?.email;
                      const passengerName = passenger.name || passenger.user?.name;
                      alert(`Send announcement/message to ${passengerName} (${passengerEmail})`);
                    }}
                    style={{ 
                      minWidth: "120px",
                      fontSize: "0.875rem",
                      padding: "0.5rem 1rem"
                    }}
                  >
                    📧 Send Message
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

