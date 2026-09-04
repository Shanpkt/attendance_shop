import React, { useEffect, useRef, useState } from "react";

const REQUIRED_ACCURACY_METERS = 400;

function GPSLocation({ onLocationReady }) {
  const [loading, setLoading] = useState(true);
  const [currentAccuracy, setCurrentAccuracy] = useState(null);
  const [error, setError] = useState("");

  const onLocationReadyRef = useRef(onLocationReady);
  const watchIdRef = useRef(null);
  const completedRef = useRef(false);

  onLocationReadyRef.current = onLocationReady;

  useEffect(() => {
    completedRef.current = false;

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
      if (completedRef.current) {
        return;
      }

      const { latitude, longitude, accuracy } = position.coords;

      if (accuracy <= REQUIRED_ACCURACY_METERS) {
        sendLocationToApp({
          latitude,
          longitude,
          accuracy,
        });
        return;
      }

      setCurrentAccuracy(accuracy);
      setLoading(true);
      setError("");
    };

    const handleError = (gpsError) => {
      if (completedRef.current) {
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

    return () => {
      stopWatching();
    };
  }, []);

  return (
    <div>
      {loading && (
        <div className="loading-box">
          <div className="spinner"></div>
          <div>
            <strong>Getting your location</strong>
            <p>
              {currentAccuracy != null
                ? `Current accuracy: ${Math.round(
                    currentAccuracy
                  )} meters. Need ${REQUIRED_ACCURACY_METERS}m or better.`
                : "Please wait while we get an accurate location."}
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
