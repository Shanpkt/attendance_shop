import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

function GPSLocation({ onLocationReady }) {
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");

  // Store retry timer
  const retryTimerRef = useRef(null);

  // ==========================================
  // GET LOCATION
  // ==========================================

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser."
      );

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

        // ======================================
        // ACCURACY GOOD
        // ======================================

        if (accuracy <= 250) {
          const locationData = {
            latitude,
            longitude,
            accuracy,
          };

          setLocation(locationData);
          setLoading(false);

          console.log(
            "Location verified:",
            locationData
          );

          // Send location to App
          if (onLocationReady) {
            onLocationReady(locationData);
          }

          return;
        }

        // ======================================
        // ACCURACY NOT GOOD ENOUGH
        // ======================================

        console.log(
          `Accuracy ${Math.round(
            accuracy
          )}m. Trying again...`
        );

        retryTimerRef.current = setTimeout(() => {
          getLocation();
        }, 2000);
      },

      // ========================================
      // GPS ERROR
      // ========================================

      (gpsError) => {
        console.error(
          "Location error:",
          gpsError
        );

        // Permission denied
        if (gpsError.code === 1) {
          setError(
            "Location permission denied. Please allow location access."
          );

          setLoading(false);

          return;
        }

        // Other temporary errors
        console.log(
          "Temporary GPS error. Retrying..."
        );

        retryTimerRef.current = setTimeout(() => {
          getLocation();
        }, 2000);
      },

      // ========================================
      // GPS OPTIONS
      // ========================================

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onLocationReady]);

  // ==========================================
  // START GPS WHEN COMPONENT LOADS
  // ==========================================

  useEffect(() => {
    getLocation();

    // Cleanup retry timer
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(
          retryTimerRef.current
        );
      }
    };
  }, [getLocation]);

  // ==========================================
  // UI
  // ==========================================

  return (
    <div>

      {/* ======================================
          LOADING
      ====================================== */}

      {loading && (
        <div className="loading-box">

          <div className="spinner"></div>

          <div>
            <strong>
              Getting your location
            </strong>

            <p>
              Please wait while we get an
              accurate location.
            </p>
          </div>

        </div>
      )}

      {/* ======================================
          SUCCESS
      ====================================== */}

      {location && !loading && (
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
              {Math.round(
                location.accuracy
              )}{" "}
              meters
            </p>
          </div>

        </div>
      )}

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="error-box">

          <strong>
            Location unavailable
          </strong>

          <p>{error}</p>

          <button
            type="button"
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