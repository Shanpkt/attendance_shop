import React, { useEffect, useRef, useState } from "react";

import {
  MAX_GPS_ACCURACY_METERS,
  SETTINGS_API,
  getDistanceInMeters,
  getGeofenceRadius,
} from "./utils/geo";

function GPSLocation({ onLocationReady }) {
  const [loading, setLoading] = useState(true);
  const [currentAccuracy, setCurrentAccuracy] = useState(null);
  const [currentDistance, setCurrentDistance] = useState(null);
  const [officeRadius, setOfficeRadius] = useState(100);
  const [error, setError] = useState("");

  const onLocationReadyRef = useRef(onLocationReady);
  const watchIdRef = useRef(null);
  const completedRef = useRef(false);
  const officeRef = useRef(null);

  onLocationReadyRef.current = onLocationReady;

  useEffect(() => {
    completedRef.current = false;
    let cancelled = false;

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }

    const stopWatching = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };

    const sendLocationToApp = (locationData) => {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;
      stopWatching();
      onLocationReadyRef.current?.(locationData);
    };

    const handlePosition = (position) => {
      if (completedRef.current || cancelled) {
        return;
      }

      const office = officeRef.current;

      if (!office) {
        return;
      }

      const { latitude, longitude, accuracy } = position.coords;
      const distance = getDistanceInMeters(
        office.latitude,
        office.longitude,
        latitude,
        longitude
      );

      setCurrentAccuracy(accuracy);
      setCurrentDistance(distance);
      setOfficeRadius(office.radius);
      setLoading(true);
      setError("");

      if (accuracy > MAX_GPS_ACCURACY_METERS) {
        return;
      }

      if (distance > office.radius) {
        return;
      }

      sendLocationToApp({
        latitude,
        longitude,
        accuracy,
        distance,
      });
    };

    const handleError = (gpsError) => {
      if (completedRef.current || cancelled) {
        return;
      }

      if (gpsError.code === 1) {
        stopWatching();
        setError(
          "Location permission denied. Please allow location access."
        );
        setLoading(false);
        return;
      }

      setError("");
      setLoading(true);
    };

    const startWatching = () => {
      const options = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        options
      );
    };

    const loadOfficeAndWatch = async () => {
      try {
        const response = await fetch(SETTINGS_API);
        const json = await response.json();
        const data = json?.data;
        const latitude = Number(data?.latitude);
        const longitude = Number(data?.longitude);

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          setError(
            "Office location is not set. Please contact admin."
          );
          setLoading(false);
          return;
        }

        const office = {
          latitude,
          longitude,
          radius: getGeofenceRadius(),
        };

        officeRef.current = office;
        setOfficeRadius(office.radius);

        if (!cancelled) {
          startWatching();
        }
      } catch (fetchError) {
        console.error("Office location fetch error:", fetchError);
        setError(
          "Unable to load office location. Please try again."
        );
        setLoading(false);
      }
    };

    loadOfficeAndWatch();

    return () => {
      cancelled = true;
      stopWatching();
    };
  }, []);

  const tooFar =
    currentDistance != null &&
    currentDistance > officeRadius &&
    currentAccuracy != null &&
    currentAccuracy <= MAX_GPS_ACCURACY_METERS;

  return (
    <div>
      {loading && !error && (
        <div className={tooFar ? "warning-box" : "loading-box"}>
          {!tooFar && <div className="spinner"></div>}
          <div>
            <strong>
              {tooFar
                ? "You are outside the office area"
                : "Checking your location"}
            </strong>
            <p>
              {tooFar
                ? `You are ${Math.round(currentDistance)} meters away. Move within ${Math.round(officeRadius)} meters of the office to punch.`
                : currentAccuracy != null
                ? `GPS accuracy: ${Math.round(currentAccuracy)}m. Need ${MAX_GPS_ACCURACY_METERS}m or better, and within ${Math.round(officeRadius)}m of the office.`
                : `Please wait while we confirm you are within ${Math.round(officeRadius)} meters of the office.`}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="error-box">
          <strong>Location unavailable</strong>
          <p>{error}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default GPSLocation;
