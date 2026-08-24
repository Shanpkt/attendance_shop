import React, { useEffect, useState } from "react";

function GPSLocation({ onLocationReady }) {
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getLocation();

    // Cleanup
    return () => {
      // Nothing to clean here
    };
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude,
          longitude,
          accuracy,
        } = position.coords;

        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);
        console.log(
          "Accuracy:",
          Math.round(accuracy),
          "meters"
        );

        // Continue until accuracy <= 150m
        if (accuracy <= 150) {
          const locationData = {
            latitude,
            longitude,
            accuracy,
          };

          setLocation(locationData);
          setLoading(false);

          // Send location to App
          if (onLocationReady) {
            onLocationReady(locationData);
          }
        } else {
          console.log(
            `Accuracy ${Math.round(
              accuracy
            )}m. Trying again...`
          );

          setTimeout(() => {
            getLocation();
          }, 2000);
        }
      },

      (error) => {
        console.error("Location error:", error);

        if (error.code === 1) {
          setError(
            "Location permission denied. Please allow location access."
          );
          setLoading(false);
        } else {
          console.log("Temporary GPS error. Retrying...");

          setTimeout(() => {
            getLocation();
          }, 2000);
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div>
      {loading && (
        <div className="loading-box">
          <div className="spinner"></div>

          <div>
            <strong>
              Getting your location
            </strong>

            <p>
              Please wait while we get an accurate
              location.
            </p>
          </div>
        </div>
      )}

      {location && (
        <div className="success-box">
          <div className="success-icon">
            ✓
          </div>

          <div>
            <strong>
              Location verified
            </strong>

            <p>
              Accuracy:{" "}
              {Math.round(location.accuracy)}
              {" "}meters
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="error-box">
          <strong>Location unavailable</strong>

          <p>{error}</p>

          <button
            className="secondary-button"
            onClick={getLocation}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default GPSLocation;