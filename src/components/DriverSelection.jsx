import { useState, useEffect } from "react";
import { fetchAvailableDrivers } from "../services/passengerService";
import "../styles/driver-selection.css";

export default function DriverSelection({ 
  token, 
  pickupPlaceId, 
  pickupLat, 
  pickupLng,
  onSelectDriver, 
  onSkip,
  onBack 
}) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    loadDrivers();
  }, [pickupPlaceId, pickupLat, pickupLng]);

  const loadDrivers = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (pickupPlaceId) {
        params.pickup_place_id = pickupPlaceId;
      } else if (pickupLat && pickupLng) {
        params.pickup_lat = pickupLat;
        params.pickup_lng = pickupLng;
      }
      params.radius = 10; // 10km radius

      const response = await fetchAvailableDrivers(token, params);
      const driversData = response?.data || [];
      const metaData = response?.meta || {};
      
      setDrivers(driversData);
      setMeta(metaData);
      
      if (driversData.length === 0) {
        setError("No drivers available nearby. You can skip to let the system find a driver for you.");
      }
    } catch (err) {
      console.error("[DriverSelection] Failed to load drivers:", err);
      setError(
        err?.data?.message || err?.message || "Unable to load available drivers"
      );
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDriver = (driver) => {
    if (driver.is_available) {
      onSelectDriver(driver);
    }
  };

  const formatDistance = (distanceKm) => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m away`;
    }
    return `${distanceKm.toFixed(1)}km away`;
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <span className="driver-rating">
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={i} className="star star--full">⭐</span>
        ))}
        {hasHalfStar && <span className="star star--half">⭐</span>}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={i} className="star star--empty">☆</span>
        ))}
        <span className="rating-value">
          {rating > 0 ? rating.toFixed(1) : "New"}
        </span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="driver-selection">
        <div className="driver-selection__loading">
          <div className="spinner"></div>
          <p>Finding available drivers nearby...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-selection">
      <div className="driver-selection__header">
        <h3>Choose Your Driver</h3>
        <p className="driver-selection__description">
          Select a driver or let the system find one for you
        </p>
        {meta && (
          <p className="driver-selection__meta">
            Found {meta.total_available || drivers.length} driver
            {drivers.length !== 1 ? "s" : ""} within {meta.radius_km || 10}km
          </p>
        )}
      </div>

      {error && drivers.length === 0 && (
        <div className="alert alert--info" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {drivers.length > 0 && (
        <div className="driver-selection__list">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className={`driver-card ${!driver.is_available ? "driver-card--unavailable" : ""}`}
            >
              <div className="driver-card__content">
                <div className="driver-card__header">
                  <div className="driver-card__info">
                    <h4 className="driver-card__name">
                      {driver.name || "Driver"}
                    </h4>
                    {driver.average_rating > 0 && driver.total_ratings > 0 ? (
                      <div className="driver-card__rating">
                        {renderStars(driver.average_rating)}
                        <span className="rating-count">
                          ({driver.total_ratings} {driver.total_ratings === 1 ? "rating" : "ratings"})
                        </span>
                      </div>
                    ) : (
                      <div className="driver-card__rating">
                        <span className="rating-value">New Driver</span>
                      </div>
                    )}
                  </div>
                  <div className="driver-card__distance">
                    <span className="distance-value">
                      {formatDistance(driver.distance_km)}
                    </span>
                  </div>
                </div>

                <div className="driver-card__details">
                  <div className="driver-card__vehicle">
                    <span className="vehicle-icon">🚗</span>
                    <div>
                      <strong>{driver.vehicle_make} {driver.vehicle_model}</strong>
                      {driver.plate_number && (
                        <span className="plate-number"> • {driver.plate_number}</span>
                      )}
                    </div>
                  </div>

                  {driver.current_place && (
                    <div className="driver-card__location">
                      <span className="location-icon">📍</span>
                      <span>{driver.current_place.name}</span>
                    </div>
                  )}

                  {driver.phone && (
                    <div className="driver-card__contact">
                      <span className="contact-icon">📞</span>
                      <span>{driver.phone}</span>
                    </div>
                  )}
                </div>

                {!driver.is_available && (
                  <div className="driver-card__unavailable-badge">
                    Currently on another ride
                  </div>
                )}
              </div>

              <div className="driver-card__actions">
                <button
                  onClick={() => handleSelectDriver(driver)}
                  disabled={!driver.is_available}
                >
                  Select This Driver
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="driver-selection__actions">
        {onBack && (
          <button onClick={onBack} className="secondary">
            ← Back
          </button>
        )}
        <button onClick={onSkip} className="secondary">
          Skip - Let System Find Driver
        </button>
        <button onClick={loadDrivers} className="secondary">
          🔄 Refresh List
        </button>
      </div>
    </div>
  );
}

