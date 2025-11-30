import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  driverRideAction,
  fetchDriverProfile,
  fetchDriverQueue,
  updateDriverAvailability,
  updateDriverLocation,
  declineRide,
  fetchDriverHistory,
} from "../../services/driverService";
import { fetchPlaces, searchPlaces } from "../../services/placesService";
import EmergencyButton from "../../components/EmergencyButton";
import FeedbackForm from "../../components/FeedbackForm";
import "../../styles/dashboard.css";

const locationDefaults = {
  barangay: "",
};

// Barangays in Bulan, Sorsogon
const BULAN_BARANGAYS = [
  "Abad Santos",
  "Aguinaldo",
  "Antipolo",
  "Aquino",
  "Bagong Silang",
  "Banga",
  "Bantayan",
  "Baybay",
  "Bubulusan",
  "Buenavista",
  "Buli",
  "Cagamutan",
  "Cogon",
  "Dancalan",
  "Dapdap",
  "Fabrica",
  "Fatima",
  "Gate",
  "Gintotolo",
  "Guinlajon",
  "Hacienda",
  "J. Gerona",
  "J.P. Laurel",
  "Juban",
  "La Purisima",
  "Lajong",
  "Lapinig",
  "Mabini",
  "Monbon",
  "Nasuje",
  "Obrero",
  "Osmena",
  "Poblacion",
  "Polo",
  "Quezon",
  "Rizal",
  "Roxas",
  "Sabang",
  "Salvacion",
  "San Antonio",
  "San Bernardo",
  "San Francisco",
  "San Isidro",
  "San Juan",
  "San Ramon",
  "Santa Remedios",
  "Santa Teresita",
  "Sapngan",
  "Tabing Dagat",
  "Tabing Ilog",
  "Tacdangan",
  "Talolong",
  "Taromata",
  "Villareal",
  "Zone 1",
  "Zone 2",
  "Zone 3",
  "Zone 4",
  "Zone 5",
].sort();

export default function DriverDashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [queue, setQueue] = useState([]);
  const [availability, setAvailability] = useState(false);
  const [location, setLocation] = useState(locationDefaults);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rideForFeedback, setRideForFeedback] = useState(null);
  const [places, setPlaces] = useState([]);

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetchDriverProfile(token);
      // Handle both direct response and wrapped response (data.data or data)
      const profileData = response?.data || response;
      console.log("[DriverDashboard] Profile loaded:", profileData);
      setProfile(profileData);
      setAvailability(profileData?.is_online || false);
      
      // Note: We don't auto-populate the location form to preserve user's current selection
      // Location only updates when driver manually submits the form
      
      // Clear error on successful load
      if (profileData) {
        setError("");
      }
    } catch (err) {
      console.error("[DriverDashboard] Failed to load profile:", err);
      setError(err?.message ?? "Unable to load profile");
    }
  }, [token]);

  const loadQueue = useCallback(async () => {
    try {
      console.log("[DriverDashboard] Loading ride queue...");
      const data = await fetchDriverQueue(token);
      console.log("[DriverDashboard] Queue response:", data);
      
      const rides = Array.isArray(data) ? data : data?.data || [];
      console.log("[DriverDashboard] Parsed rides:", rides);
      console.log("[DriverDashboard] Ride statuses in queue:", rides.map(r => ({ id: r.id, status: r.status, driver_id: r.driver_id })));
      
      // Filter to ensure we only show rides relevant to this driver
      // Include: requested (general queue) OR assigned/accepted/in_progress (assigned to this driver)
      // Exclude: completed, cancelled rides
      const relevantRides = rides.filter(ride => {
        const status = ride.status?.toLowerCase();
        
        // Exclude completed and cancelled rides
        if (status === 'completed' || status === 'cancelled' || status === 'canceled') {
          return false;
        }
        
        // Show requested rides (general queue)
        if (status === 'requested' || status === 'pending') {
          return true;
        }
        // Show assigned/accepted/in_progress rides (assigned to this driver)
        // Backend now returns these correctly
        if (status === 'assigned' || status === 'accepted' || status === 'in_progress' || status === 'picked_up') {
          return true; // Backend returns rides assigned to this driver
        }
        return false;
      });
      
      console.log("[DriverDashboard] Relevant rides after filtering:", relevantRides.map(r => ({ id: r.id, status: r.status })));
      
      // Additional check: Remove any completed/cancelled rides that might have slipped through
      const cleanedRides = relevantRides.filter(ride => {
        const status = ride.status?.toLowerCase();
        const isCompleted = status === 'completed' || status === 'cancelled' || status === 'canceled';
        if (isCompleted) {
          console.warn(`[DriverDashboard] Filtering out completed/cancelled ride:`, { id: ride.id, status: ride.status });
        }
        return !isCompleted;
      });
      
      setQueue(cleanedRides);
      
      // Clear error on successful load
      if (cleanedRides.length === 0) {
        console.log("[DriverDashboard] Queue is empty (no rides available)");
      } else {
        const assignedCount = cleanedRides.filter(r => {
          const s = r.status?.toLowerCase();
          return s === 'assigned' || s === 'accepted';
        }).length;
        const pendingCount = cleanedRides.filter(r => {
          const s = r.status?.toLowerCase();
          return s === 'pending' || s === 'requested';
        }).length;
        const activeCount = cleanedRides.filter(r => {
          const s = r.status?.toLowerCase();
          return s === 'accepted' || s === 'in_progress' || s === 'picked_up';
        }).length;
        console.log(`[DriverDashboard] Queue summary: ${assignedCount} assigned/accepted, ${pendingCount} pending/requested, ${activeCount} active`);
      }
    } catch (err) {
      console.error("[DriverDashboard] Failed to load queue:", err);
      const errorMessage = err?.data?.message || err?.message || "Unable to load ride queue";
      setError(errorMessage);
      
      // Set empty queue on error to prevent showing stale data
      setQueue([]);
    }
  }, [token]);

  const loadHistory = useCallback(
    async (page = 1) => {
      try {
        const data = await fetchDriverHistory(token, page);
        if (Array.isArray(data)) {
          setHistory(data);
        } else if (data?.data) {
          setHistory(data.data);
        } else {
          setHistory([]);
        }
        setHistoryPage(page);
      } catch (err) {
        setError(
          err?.message || err?.data?.message || "Unable to load trip history"
        );
      }
    },
    [token]
  );

  const loadPlaces = useCallback(async () => {
    try {
      const data = await fetchPlaces();
      setPlaces(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      // Silently fail - places are optional for location updates
      console.warn("[DriverDashboard] Places API unavailable, location matching will use search:", err?.message);
      setPlaces([]);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadProfile();
      loadQueue();
      
      // Load places in background - don't block if it fails
      // Use setTimeout to ensure it doesn't block initial render
      const placesTimeout = setTimeout(() => {
        loadPlaces().catch((err) => {
          console.warn("[DriverDashboard] Places load error (non-critical):", err?.message);
        });
      }, 500);

      // Auto-refresh profile every 30 seconds to catch approval status updates
      const profileInterval = setInterval(() => {
        loadProfile();
      }, 30000);

      // Auto-refresh queue every 15 seconds when online
      const queueInterval = setInterval(() => {
        if (availability) {
          loadQueue();
        }
      }, 15000);

      return () => {
        clearTimeout(placesTimeout);
        clearInterval(profileInterval);
        clearInterval(queueInterval);
      };
    }
  }, [token, availability, loadProfile, loadQueue, loadPlaces]);

  const toggleAvailability = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await updateDriverAvailability(token, { is_online: !availability });
      const newStatus = !availability;
      setAvailability(newStatus);
      setSuccess(
        newStatus
          ? "You are now online and will receive ride requests!"
          : "You are now offline."
      );
      // Reload queue when going online to get new rides
      if (newStatus) {
        await loadQueue();
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to update status. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const submitLocation = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (!location.barangay) {
        setError("Please select a barangay");
        setBusy(false);
        return;
      }
      
      // Find place_id for the selected barangay
      let placeId = null;
      
      // First, try to find in already loaded places
      const barangayPlace = places.find(
        (place) =>
          place.name.toLowerCase() === location.barangay.toLowerCase() ||
          place.address.toLowerCase().includes(`${location.barangay.toLowerCase()}, bulan`) ||
          place.address.toLowerCase().includes(location.barangay.toLowerCase())
      );
      
      if (barangayPlace) {
        placeId = barangayPlace.id;
      } else {
        // If not found, search for it
        try {
          const searchResults = await searchPlaces(location.barangay);
          const allResults = Array.isArray(searchResults) ? searchResults : searchResults?.data || [];
          const foundPlace = allResults.find(p => 
            p.name.toLowerCase() === location.barangay.toLowerCase() ||
            p.address.toLowerCase().includes(`${location.barangay.toLowerCase()}, bulan`) ||
            p.name.toLowerCase().includes(location.barangay.toLowerCase())
          );
          
          if (foundPlace) {
            placeId = foundPlace.id;
          }
        } catch (searchErr) {
          console.error("[DriverDashboard] Failed to search places:", searchErr);
        }
      }
      
      if (!placeId) {
        setError(`Place not found for barangay: ${location.barangay}. Please ensure the barangay exists in the places database.`);
        setBusy(false);
        return;
      }
      
      // Send place_id (backend will validate and use its coordinates)
      const payload = {
        place_id: placeId,
      };
      
      const response = await updateDriverLocation(token, payload);
      console.log("[DriverDashboard] Location update response:", response);
      
      // Wait a moment for backend to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload profile to get updated location
      await loadProfile();
      
      // Trigger event for profile page to refresh (multiple methods for reliability)
      window.dispatchEvent(new Event('driverLocationUpdated'));
      window.dispatchEvent(new CustomEvent('driverLocationUpdated', { detail: { timestamp: Date.now() } }));
      localStorage.setItem('driver_location_updated', Date.now().toString());
      
      // Also trigger a storage event manually (for same-tab detection)
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'driver_location_updated',
        newValue: Date.now().toString(),
        storageArea: localStorage
      }));
      
      setLocation(locationDefaults);
      setSuccess(`Location updated! Barangay: ${location.barangay}. Your location will persist until you update it again.`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.message ||
          "Location update failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDeclineRide = async (rideId) => {
    if (!window.confirm("Are you sure you want to decline this ride request?")) {
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await declineRide(token, rideId);
      setSuccess("Ride declined. It will be available for other drivers.");
      await loadQueue();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err?.data?.message || err?.message || "Failed to decline ride. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRideAction = async (rideId, action) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await driverRideAction(token, rideId, action);
      // Reload queue to get updated ride status
      await loadQueue();

      // Show success message based on action
      const messages = {
        accept: "Ride accepted! Please proceed to pickup location.",
        pickup: "Passenger picked up! Ride in progress.",
        complete: "Ride completed successfully! You can now accept new bookings.",
      };
      setSuccess(messages[action] || "Action completed successfully!");
      
      // Show feedback form after ride completion
      if (action === "complete") {
        const completedRide = queue.find((r) => r.id === rideId);
        if (completedRide) {
          setRideForFeedback(completedRide);
          setShowFeedback(true);
        }
        
        // Reload queue to remove completed ride from available rides
        // Reload history to add completed ride to trip history
        // Auto-expand history section to show the completed ride
        setTimeout(async () => {
          await loadQueue(); // Remove from available rides (completed rides are filtered out)
          await loadHistory(1); // Add to trip history (reload first page)
          setShowHistory(true); // Auto-expand history section to show completed ride
        }, 1000);
      }
      
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(
        err?.data?.message || err?.message || "Action failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  // Check status from profile or nested driverProfile
  const profileStatus = profile?.status || profile?.driverProfile?.status || "pending";
  const needsApproval = profileStatus !== "approved";
  
  console.log("[DriverDashboard] Current profile status:", {
    profile,
    status: profileStatus,
    needsApproval,
    is_online: profile?.is_online,
  });

  // Safe rendering - ensure component always returns something
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
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h2>Driver Console</h2>
          <p>
            {profile?.vehicle_make} {profile?.vehicle_model}
            {profile?.plate_number && ` • ${profile.plate_number}`}
          </p>
          {needsApproval && profileStatus !== "rejected" && (
            <span className="alert alert--error">
              ⏳ Awaiting admin approval (Status: {profileStatus})
            </span>
          )}
          {profileStatus === "approved" && (
            <span className="alert alert--success">
              ✅ Approved - You can now go online
            </span>
          )}
          {profileStatus === "rejected" && (
            <span className="alert alert--error">
              ❌ Rejected - Please contact administrator
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <EmergencyButton token={token} userRole="driver" />
          <button 
            onClick={() => navigate('/driver/profile')} 
            className="secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            👤 Profile
          </button>
          <button onClick={loadProfile} className="secondary" disabled={busy}>
            Refresh Status
          </button>
          <button onClick={logout} className="secondary">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      {/* Show when passenger has selected this driver */}
      {(() => {
        const assignedRides = queue.filter(ride => {
          const status = ride.status?.toLowerCase();
          return status === 'assigned' || status === 'accepted' || status === 'in_progress' || status === 'picked_up';
        });
        
        if (assignedRides.length > 0) {
          return assignedRides.map((ride) => (
            <section 
              key={ride.id} 
              className="panel" 
              style={{ 
                borderLeft: '4px solid #10b981',
                backgroundColor: '#f0fdf4',
                marginBottom: '1.5rem'
              }}
            >
              <div className="panel__header">
                <div>
                  <h3 style={{ color: '#059669', margin: 0 }}>
                    🎉 You've Been Booked!
                  </h3>
                  <p className="panel__description" style={{ marginTop: '0.5rem' }}>
                    {ride.status?.toLowerCase() === 'assigned' 
                      ? 'A passenger has selected you. Please accept or decline this booking.'
                      : ride.status?.toLowerCase() === 'accepted'
                      ? 'You have accepted this booking. Please proceed to pickup location or complete the ride.'
                      : ride.status?.toLowerCase() === 'picked_up' || ride.status?.toLowerCase() === 'in_progress'
                      ? 'Passenger picked up! Complete the ride when you reach the destination.'
                      : 'Active ride in progress.'}
                  </p>
                </div>
                <span className="status status--assigned" style={{ fontSize: '0.875rem' }}>
                  {ride.status?.toLowerCase() === 'assigned' ? 'Assigned' 
                   : ride.status?.toLowerCase() === 'accepted' ? 'Accepted'
                   : ride.status?.toLowerCase() === 'picked_up' ? 'Picked Up'
                   : ride.status?.toLowerCase() === 'in_progress' ? 'In Progress'
                   : ride.status || 'Active'}
                </span>
              </div>
              <dl className="details">
                <div>
                  <dt>Ride Number</dt>
                  <dd>#{ride.id}</dd>
                </div>
                <div>
                  <dt>Passenger</dt>
                  <dd>
                    <strong>{ride.passenger?.name || 'Unknown'}</strong>
                    {ride.passenger?.phone && (
                      <>
                        <br />
                        <small>Contact: {ride.passenger.phone}</small>
                        <br />
                        <a 
                          href={`tel:${ride.passenger.phone.replace(/\s+/g, '')}`}
                          style={{
                            display: 'inline-block',
                            marginTop: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: 'var(--accent-primary, #3b82f6)',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                          }}
                        >
                          📞 Call Passenger
                        </a>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Pickup Location</dt>
                  <dd>
                    {ride.pickup_place?.name || ride.pickup_address || 'Not specified'}
                    {ride.pickup_place?.address && (
                      <>
                        <br />
                        <small className="text-muted">{ride.pickup_place.address}</small>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Destination</dt>
                  <dd>
                    {ride.dropoff_place?.name || ride.dropoff_address || 'Not specified'}
                    {ride.dropoff_place?.address && (
                      <>
                        <br />
                        <small className="text-muted">{ride.dropoff_place.address}</small>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Fare Amount</dt>
                  <dd>₱{ride.fare ? parseFloat(ride.fare).toFixed(2) : '0.00'}</dd>
                </div>
                {ride.notes && (
                  <div>
                    <dt>Passenger Notes</dt>
                    <dd>{ride.notes}</dd>
                  </div>
                )}
              </dl>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {(ride.status?.toLowerCase() === 'assigned') && (
                  <>
                    <button
                      onClick={() => handleRideAction(ride.id, 'accept')}
                      disabled={busy}
                      style={{ 
                        minWidth: '150px',
                        backgroundColor: 'var(--accent-primary, #3b82f6)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: '600',
                        fontSize: '1rem'
                      }}
                    >
                      {busy ? 'Processing...' : '✅ Accept This Booking'}
                    </button>
                    <button
                      onClick={() => handleDeclineRide(ride.id)}
                      disabled={busy}
                      className="secondary"
                      style={{ minWidth: '150px' }}
                    >
                      {busy ? 'Processing...' : '❌ Decline'}
                    </button>
                    <div style={{ 
                      width: '100%', 
                      marginTop: '0.5rem',
                      padding: '0.75rem',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '0.5rem',
                      color: '#92400e'
                    }}>
                      <strong>⚠️ Action Required:</strong> A passenger has selected you. Please accept or decline this booking.
                    </div>
                  </>
                )}
                {(ride.status?.toLowerCase() === 'accepted') && (
                  <>
                    <button
                      onClick={() => handleRideAction(ride.id, 'pickup')}
                      disabled={busy}
                      style={{ 
                        minWidth: '150px',
                        backgroundColor: 'var(--accent-primary, #3b82f6)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: '600',
                        fontSize: '1rem'
                      }}
                    >
                      {busy ? 'Processing...' : '🚗 Mark as Picked Up'}
                    </button>
                    <button
                      onClick={() => handleRideAction(ride.id, 'complete')}
                      disabled={busy}
                      style={{ 
                        minWidth: '150px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: '600',
                        fontSize: '1rem',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!busy) e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      {busy ? 'Processing...' : '✅ Complete Ride'}
                    </button>
                    <div style={{ 
                      width: '100%', 
                      marginTop: '0.5rem',
                      padding: '0.75rem',
                      backgroundColor: '#dbeafe',
                      border: '1px solid #3b82f6',
                      borderRadius: '0.5rem',
                      color: '#1e40af'
                    }}>
                      <strong>✅ Booking Accepted!</strong> Please proceed to the pickup location. The passenger has been notified.
                    </div>
                    <div style={{ 
                      width: '100%', 
                      marginTop: '0.5rem',
                      padding: '0.75rem',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #f59e0b',
                      borderRadius: '0.5rem',
                      color: '#92400e',
                      fontSize: '0.875rem'
                    }}>
                      <strong>💡 Tip:</strong> After picking up the passenger, use the "✅ Complete Ride" button to finish this ride and accept new bookings.
                    </div>
                  </>
                )}
                {(ride.status?.toLowerCase() === 'picked_up' || ride.status?.toLowerCase() === 'in_progress') && (
                  <>
                    <button
                      onClick={() => handleRideAction(ride.id, 'complete')}
                      disabled={busy}
                      style={{ 
                        minWidth: '200px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '0.875rem 1.75rem',
                        borderRadius: '0.5rem',
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        boxShadow: '0 4px 6px rgba(16, 185, 129, 0.4)',
                        transition: 'all 0.2s',
                        cursor: busy ? 'not-allowed' : 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!busy) {
                          e.target.style.transform = 'scale(1.05)';
                          e.target.style.boxShadow = '0 6px 8px rgba(16, 185, 129, 0.5)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.4)';
                      }}
                    >
                      {busy ? '⏳ Processing...' : '✅ Complete Ride & Accept New Bookings'}
                    </button>
                    <div style={{ 
                      width: '100%', 
                      marginTop: '0.75rem',
                      padding: '0.875rem',
                      backgroundColor: '#d1fae5',
                      border: '2px solid #10b981',
                      borderRadius: '0.5rem',
                      color: '#065f46',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      <strong>🎯 Ready to Complete:</strong> Click the button above to finish this ride. Once completed, you'll be able to accept new bookings immediately!
                    </div>
                  </>
                )}
              </div>
            </section>
          ));
        }
        return null;
      })()}

      <section className="dashboard__grid">
        <article className="panel">
          <h3>Online Status</h3>
          <p className="panel__description">
            Toggle your availability to receive ride requests
          </p>
          <div className="details">
            <div>
              <dt>Current Status</dt>
              <dd>
                <strong
                  className={availability ? "text-success" : "text-muted"}
                >
                  {availability
                    ? "🟢 Online - Receiving Rides"
                    : "🔴 Offline - Not Available"}
                </strong>
              </dd>
            </div>
          </div>
          <button onClick={toggleAvailability} disabled={busy || needsApproval}>
            {busy ? "Updating..." : availability ? "Go Offline" : "Go Online"}
          </button>
          {needsApproval && (
            <p
              className="text-muted"
              style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}
            >
              You must be approved by an administrator before going online.
            </p>
          )}
        </article>

        <article className="panel">
          <h3>Update Your Location</h3>
          <p className="panel__description">
            Keep your location updated so passengers can find you. Your location will persist until you manually update it.
          </p>
          {profile?.current_place && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: '0.75rem', 
              backgroundColor: '#f0f9ff',
              border: '1px solid #3b82f6',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <strong>📍 Current Location:</strong> {profile.current_place.name}
              {profile.current_place.address && (
                <><br /><small className="text-muted">{profile.current_place.address}</small></>
              )}
              {profile.location_updated_at && (
                <><br /><small className="text-muted">Last updated: {new Date(profile.location_updated_at).toLocaleString()}</small></>
              )}
            </div>
          )}
          <form className="form form--stacked" onSubmit={submitLocation}>
            <label>
              Barangay (Bulan, Sorsogon) *
              <select
                name="barangay"
                value={location.barangay}
                onChange={(e) =>
                  setLocation((prev) => ({ ...prev, barangay: e.target.value }))
                }
                required
              >
                <option value="">Select barangay...</option>
                {BULAN_BARANGAYS.map((barangay) => (
                  <option key={barangay} value={barangay}>
                    {barangay}
                  </option>
                ))}
              </select>
              <small>Select your current barangay in Bulan, Sorsogon</small>
            </label>
            
            <button type="submit" disabled={busy || needsApproval || !location.barangay}>
              {busy ? "Updating..." : "Update My Location"}
            </button>
            <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
              💡 Select your barangay to update your location for better ride matching
            </p>
          </form>
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Available Rides</h3>
            <p className="panel__description">
              View and manage ride requests from passengers
            </p>
          </div>
          <button className="secondary" onClick={loadQueue} disabled={busy}>
            {busy ? "Loading..." : "Refresh List"}
          </button>
        </div>
        
        {needsApproval && (
          <div className="alert alert--error" style={{ marginBottom: "1rem" }}>
            <strong>⚠️ Driver not approved yet.</strong> You need admin approval before you can receive ride requests. 
            Current status: <strong>{profileStatus}</strong>
          </div>
        )}
        
        {(() => {
          // Only count rides that are truly active (not completed, cancelled, or just assigned)
          // Active = driver has accepted and ride is in progress
          const activeRides = queue.filter(ride => {
            const status = ride.status?.toLowerCase();
            // Exclude completed/cancelled rides
            if (status === 'completed' || status === 'cancelled' || status === 'canceled') {
              return false;
            }
            // Exclude assigned rides - they don't count as active (driver hasn't accepted yet)
            if (status === 'assigned') {
              return false;
            }
            // Only count accepted, in_progress, or picked_up as active
            // These are rides the driver has accepted and are in progress
            return status === 'accepted' || status === 'in_progress' || status === 'picked_up';
          });
          
          // Debug logging
          console.log("[DriverDashboard] Active ride check:", {
            totalQueue: queue.length,
            activeRides: activeRides.length,
            activeRideDetails: activeRides.map(r => ({ id: r.id, status: r.status })),
            allRides: queue.map(r => ({ id: r.id, status: r.status }))
          });
          
          if (activeRides.length > 0 && availability && !needsApproval) {
            return (
              <div style={{ 
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: '#fef3c7',
                border: '2px solid #f59e0b',
                borderRadius: '0.5rem',
                color: '#92400e'
              }}>
                <strong>⚠️ You have an active ride!</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                  You currently have {activeRides.length} active ride{activeRides.length > 1 ? 's' : ''}. 
                  Please complete {activeRides.length > 1 ? 'them' : 'it'} before accepting new bookings.
                </p>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {activeRides.map((ride) => {
                    const canComplete = ['accepted', 'picked_up', 'in_progress'].includes(ride.status?.toLowerCase());
                    if (!canComplete) return null;
                    
                    return (
                      <button
                        key={ride.id}
                        onClick={() => handleRideAction(ride.id, 'complete')}
                        disabled={busy}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '0.625rem 1.25rem',
                          borderRadius: '0.5rem',
                          fontWeight: '600',
                          fontSize: '0.875rem',
                          cursor: busy ? 'not-allowed' : 'pointer',
                          opacity: busy ? 0.7 : 1,
                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        {busy ? '⏳ Processing...' : `✅ Complete Ride #${ride.id}`}
                      </button>
                    );
                  })}
                </div>
                <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.875rem', fontWeight: '600' }}>
                  💡 Click the button above to complete your active ride and accept new bookings immediately!
                </p>
              </div>
            );
          }
          return null;
        })()}
        
        {!needsApproval && !availability && (
          <div className="alert" style={{ marginBottom: "1rem" }}>
            <strong>You're currently offline.</strong> Go online to see available ride requests.
          </div>
        )}
        
        {needsApproval && queue.length === 0 && (
          <div className="panel__empty">
            <p>⏳ Waiting for admin approval...</p>
            <p className="text-muted">
              You'll be able to receive ride requests once your driver profile is approved.
            </p>
          </div>
        )}
        
        {!needsApproval && queue.length === 0 && availability && (
          <div className="panel__empty">
            <p>No ride requests available at the moment.</p>
            <p className="text-muted">
              New ride requests will appear here when passengers book rides.
            </p>
            <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
              💡 Make sure you're online and your location is updated.
            </p>
          </div>
        )}
        
        {!needsApproval && queue.length === 0 && !availability && (
          <div className="panel__empty">
            <p>You're offline. Go online to receive ride requests.</p>
            <p className="text-muted">
              Click "Go Online" in the Online Status section above.
            </p>
          </div>
        )}
        {queue.map((ride) => (
          <div className="queue__item" key={ride.id}>
            <div>
              <h4>Ride Request #{ride.id}</h4>
              {ride.passenger && (
                <div className="details" style={{ marginTop: "0.5rem" }}>
                  <div>
                    <dt>Passenger Name</dt>
                    <dd>
                      <strong>{ride.passenger.name}</strong>
                    </dd>
                  </div>
                  {ride.passenger.phone && (
                    <div>
                      <dt>Contact Number</dt>
                      <dd>{ride.passenger.phone}</dd>
                    </div>
                  )}
                </div>
              )}
              <div className="details" style={{ marginTop: "0.5rem" }}>
                <div>
                  <dt>Pickup Location</dt>
                  <dd>
                    {ride.pickup_place?.name ||
                      ride.pickup_address ||
                      (ride.pickup_lat && ride.pickup_lng
                        ? `${ride.pickup_lat}, ${ride.pickup_lng}`
                        : "Not specified")}
                    {ride.pickup_place?.address && (
                      <>
                        <br />
                        <small className="text-muted">
                          {ride.pickup_place.address}
                        </small>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Destination</dt>
                  <dd>
                    {ride.dropoff_place?.name ||
                      ride.dropoff_address ||
                      (ride.drop_lat && ride.drop_lng
                        ? `${ride.drop_lat}, ${ride.drop_lng}`
                        : "Not specified")}
                    {ride.dropoff_place?.address && (
                      <>
                        <br />
                        <small className="text-muted">
                          {ride.dropoff_place.address}
                        </small>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Fare Amount</dt>
                  <dd>
                    ₱{ride.fare ? parseFloat(ride.fare).toFixed(2) : "0.00"}
                  </dd>
                </div>
                <div>
                  <dt>Current Status</dt>
                  <dd>
                    <span
                      className={`status status--${ride.status
                        ?.toLowerCase()
                        .replace("_", "-")}`}
                    >
                      {ride.status?.toLowerCase() === "requested" && "Waiting for Acceptance"}
                      {ride.status?.toLowerCase() === "pending" && "Waiting for Acceptance"}
                      {ride.status?.toLowerCase() === "assigned" && "Assigned to You"}
                      {ride.status?.toLowerCase() === "accepted" && "Ready for Pickup"}
                      {(ride.status?.toLowerCase() === "picked_up" || ride.status?.toLowerCase() === "in_progress") && "In Progress"}
                      {ride.status?.toLowerCase() === "completed" && "Completed"}
                      {![
                        "pending",
                        "requested",
                        "assigned",
                        "accepted",
                        "picked_up",
                        "in_progress",
                        "completed",
                      ].includes(ride.status?.toLowerCase()) && ride.status}
                    </span>
                  </dd>
                </div>
              </div>
              {ride.notes && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem",
                    background: "#f8f9fa",
                    borderRadius: "0.5rem",
                  }}
                >
                  <strong>Passenger Notes:</strong> {ride.notes}
                </div>
              )}
            </div>
            <div className="queue__actions">
              {(ride.status?.toLowerCase() === "pending" || ride.status?.toLowerCase() === "requested") && (
                <>
                  {(() => {
                    // Check if driver has active rides (excluding this one)
                    // Only count accepted, in_progress, or picked_up as active (NOT assigned)
                    const hasActiveRides = queue.some(r => {
                      if (r.id === ride.id) return false; // Don't count the current ride
                      const status = r.status?.toLowerCase();
                      // Only count truly active rides (accepted, in_progress, picked_up)
                      // Exclude assigned, completed, cancelled
                      return (status === 'accepted' || status === 'in_progress' || status === 'picked_up') 
                        && status !== 'completed' && status !== 'cancelled' && status !== 'canceled' && status !== 'assigned';
                    });
                    
                    return (
                      <>
                        <button
                          onClick={() => handleRideAction(ride.id, "accept")}
                          disabled={busy || !availability || hasActiveRides}
                          style={{ 
                            minWidth: "120px",
                            opacity: hasActiveRides ? 0.6 : 1,
                            cursor: hasActiveRides ? 'not-allowed' : 'pointer'
                          }}
                          title={hasActiveRides ? "Please complete your active ride first" : ""}
                        >
                          {busy ? "Processing..." : "Accept This Ride"}
                        </button>
                        <button
                          onClick={() => handleDeclineRide(ride.id)}
                          disabled={busy || !availability}
                          className="secondary"
                          style={{ minWidth: "120px" }}
                        >
                          {busy ? "Processing..." : "Decline"}
                        </button>
                      </>
                    );
                  })()}
                </>
              )}
              {ride.status?.toLowerCase() === "assigned" && (
                <>
                  {(() => {
                    // Check if driver has other active rides (excluding this one)
                    // Only count accepted, in_progress, or picked_up as active (NOT assigned)
                    const hasOtherActiveRides = queue.some(r => {
                      if (r.id === ride.id) return false; // Don't count the current ride
                      const status = r.status?.toLowerCase();
                      // Only count truly active rides (accepted, in_progress, picked_up)
                      // Exclude assigned, completed, cancelled
                      return (status === 'accepted' || status === 'in_progress' || status === 'picked_up') 
                        && status !== 'completed' && status !== 'cancelled' && status !== 'canceled' && status !== 'assigned';
                    });
                    
                    return (
                      <>
                        <button
                          onClick={() => handleRideAction(ride.id, "accept")}
                          disabled={busy || !availability || hasOtherActiveRides}
                          style={{ 
                            minWidth: "120px",
                            opacity: hasOtherActiveRides ? 0.6 : 1,
                            cursor: hasOtherActiveRides ? 'not-allowed' : 'pointer'
                          }}
                          title={hasOtherActiveRides ? "Please complete your active ride first" : ""}
                        >
                          {busy ? "Processing..." : "Accept This Ride"}
                        </button>
                        <button
                          onClick={() => handleDeclineRide(ride.id)}
                          disabled={busy || !availability}
                          className="secondary"
                          style={{ minWidth: "120px" }}
                        >
                          {busy ? "Processing..." : "Decline"}
                        </button>
                        {/* Completion button removed - only show after acceptance */}
                      </>
                    );
                  })()}
                </>
              )}
              {ride.status?.toLowerCase() === "accepted" && (
                <>
                  <button
                    onClick={() => handleRideAction(ride.id, "pickup")}
                    disabled={busy}
                    style={{ minWidth: "120px" }}
                  >
                    {busy ? "Processing..." : "Mark as Picked Up"}
                  </button>
                  <button
                    onClick={() => handleRideAction(ride.id, "complete")}
                    disabled={busy}
                    style={{ 
                      minWidth: "140px",
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      fontWeight: "600"
                    }}
                  >
                    {busy ? "Processing..." : "✅ Complete Ride"}
                  </button>
                </>
              )}
              {(ride.status?.toLowerCase() === "picked_up" || ride.status?.toLowerCase() === "in_progress") && (
                <button
                  onClick={() => handleRideAction(ride.id, "complete")}
                  disabled={busy}
                  style={{ 
                    minWidth: "140px",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    fontWeight: "600"
                  }}
                >
                  {busy ? "Processing..." : "✅ Complete Ride"}
                </button>
              )}
              {!["pending", "requested", "assigned", "accepted", "picked_up", "in_progress"].includes(ride.status?.toLowerCase()) && (
                <span className="status">{ride.status}</span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Feedback Form */}
      {showFeedback && rideForFeedback && (
        <section className="panel">
          <FeedbackForm
            token={token}
            rideId={rideForFeedback.id}
            onSuccess={() => {
              setShowFeedback(false);
              setRideForFeedback(null);
              setSuccess("Thank you for your feedback!");
              setTimeout(() => setSuccess(""), 3000);
            }}
            onSkip={() => {
              setShowFeedback(false);
              setRideForFeedback(null);
            }}
          />
        </section>
      )}

      {/* Trip History Section */}
      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Trip History</h3>
            <p className="panel__description">
              View all your completed and past rides
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="secondary"
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory && history.length === 0) {
                  loadHistory(1);
                }
              }}
            >
              {showHistory ? "Hide History" : "View History"}
            </button>
          </div>
        </div>

        {showHistory && (
          <>
            {history.length === 0 ? (
              <div className="panel__empty">
                <p>No trip history yet.</p>
                <p className="text-muted">
                  Your completed rides will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="table">
                  <div className="table__head">
                    <span>Ride #</span>
                    <span>Passenger</span>
                    <span>Route</span>
                    <span>Fare</span>
                    <span>Status</span>
                    <span>Date</span>
                  </div>
                  {history.map((ride) => (
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
                        ₱{ride.fare ? parseFloat(ride.fare).toFixed(2) : "0.00"}
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
                    </div>
                  ))}
                </div>
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
                    disabled={historyPage <= 1}
                  >
                    Previous
                  </button>
                  <button
                    className="secondary"
                    onClick={() => loadHistory(historyPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

