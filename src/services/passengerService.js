import { apiRequest } from "./apiClient";

export function createPassengerRide(token, payload) {
  return apiRequest("/api/passenger/rides", {
    method: "POST",
    token,
    body: payload,
  });
}

export function fetchCurrentPassengerRide(token) {
  return apiRequest("/api/passenger/rides/current", {
    method: "GET",
    token,
  });
}

export function cancelPassengerRide(token, rideId, reason = null) {
  const body = {};
  if (reason && reason.trim()) {
    body.reason = reason.trim();
  }
  return apiRequest(`/api/passenger/rides/${rideId}/cancel`, {
    method: "POST",
    token,
    body: Object.keys(body).length > 0 ? body : undefined,
  });
}

export function fetchPassengerHistory(token, page = 1) {
  return apiRequest(`/api/passenger/rides?page=${page}`, {
    method: "GET",
    token,
  });
}

export function fetchAvailableDrivers(token, { pickup_place_id, pickup_lat, pickup_lng, radius = 10 }) {
  const params = new URLSearchParams();
  
  if (pickup_place_id) {
    params.append('pickup_place_id', pickup_place_id);
  } else if (pickup_lat && pickup_lng) {
    params.append('pickup_lat', pickup_lat);
    params.append('pickup_lng', pickup_lng);
  }
  
  if (radius) {
    params.append('radius', radius);
  }
  
  const queryString = params.toString();
  const path = `/api/passenger/drivers/available${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest(path, {
    method: "GET",
    token,
  });
}