import React, { useEffect, useRef, useState } from "react";

import {
  SETTINGS_API,
  getDistanceInMeters,
  getGeofenceRadius,
  getMaxGpsAccuracyMeters,
  shouldKeepGpsTolerance,
} from "./utils/geo";

function GPSLocation({ onLocationReady }) {
  const [loading, setLoading] = useState(true);
  const [currentLatitude, setCurrentLatitude] = useState(null);
  const [currentLongitude, setCurrentLongitude] = useState(null);
  const [currentAccuracy, setCurrentAccuracy] = useState(null);
  const [currentDistance, setCurrentDistance] = useState(null);
  const [officeRadius, setOfficeRadius] = useState(120);
  const [maxAccuracy, setMaxAccuracy] = useState(120);
  const [keepGpsTolerance, setKeepGpsTolerance] = useState(true);
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

      setCurrentLatitude(latitude);
      setCurrentLongitude(longitude);
      setCurrentAccuracy(accuracy);
      setCurrentDistance(distance);
      setOfficeRadius(office.radius);
      setMaxAccuracy(office.maxAccuracy);
      setKeepGpsTolerance(office.keepGpsTolerance);
      setLoading(true);
      setError("");

      if (
        office.keepGpsTolerance &&
        accuracy > office.maxAccuracy
      ) {
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
          maxAccuracy: getMaxGpsAccuracyMeters(
            data?.accuracy
          ),
          keepGpsTolerance: shouldKeepGpsTolerance(
            data?.gpsTolerance
          ),
        };

        officeRef.current = office;
        setOfficeRadius(office.radius);
        setMaxAccuracy(office.maxAccuracy);
        setKeepGpsTolerance(office.keepGpsTolerance);

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
    (!keepGpsTolerance ||
      currentAccuracy <= maxAccuracy);

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
            {currentLatitude != null && currentLongitude != null ? (
              <ul className="gps-live-stats">
                <li>
                  Latitude: {Number(currentLatitude).toFixed(6)}
                </li>
                <li>
                  Longitude: {Number(currentLongitude).toFixed(6)}
                </li>
                <li>
                  Accuracy: {Math.round(currentAccuracy)}m
                  {keepGpsTolerance
                    ? ` (need ${Math.round(maxAccuracy)}m or better)`
                    : ""}
                </li>
                {currentDistance != null && (
                  <li>
                    Distance: {Math.round(currentDistance)}m
                    {` (within ${Math.round(officeRadius)}m)`}
                  </li>
                )}
              </ul>
            ) : (
              <p>
                Waiting for GPS coordinates. Please wait while we
                confirm you are within {Math.round(officeRadius)}{" "}
                meters of the office.
              </p>
            )}
            {tooFar && (
              <p>
                You are {Math.round(currentDistance)} meters away.
                Move within {Math.round(officeRadius)} meters of
                the office to punch.
              </p>
            )}
            {!tooFar && currentAccuracy != null && (
              <p>
                {keepGpsTolerance
                  ? `Comparing GPS. Need ${Math.round(maxAccuracy)}m accuracy or better, and within ${Math.round(officeRadius)}m of the office.`
                  : `Comparing GPS. GPS tolerance is ignored. Stay within ${Math.round(officeRadius)}m of the office.`}
              </p>
            )}
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
