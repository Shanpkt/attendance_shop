import React, { useState } from "react";

import GPSLocation from "./gps";
import Camera from "./camera";

import "./App.scss";

function App() {
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);

  // GPS completed
  const handleLocationReady = (locationData) => {
    console.log("Location received in App:", locationData);

    setLocation(locationData);
  };

  // Photo completed
  const handlePhotoTaken = (image) => {
    console.log("Photo received in App:", image);

    setPhoto(image);
  };

  // Submit attendance
  const submitAttendance = () => {
    if (!location) {
      alert("Location is not ready.");
      return;
    }

    if (!photo) {
      alert("Please take your selfie.");
      return;
    }

    const attendanceData = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      selfie: photo,
      timestamp: new Date().toISOString(),
    };

    console.log("FINAL ATTENDANCE:", attendanceData);

    alert("Attendance submitted!");
  };

  return (
    <div className="home">
      <div className="attendance-card">

        {/* Header */}
        <header className="header">
          <div>

            <h1 className="attendace_text">Attendance</h1>

           
          </div>
        </header> 

        {/* =======================
            GPS SECTION
        ======================= */}
<div className="main_section">
  <div className="center_box">
        {!location && (
          <section className="section">

            <div className="section-title">

              <div className="icon gps-icon">
                📍
              </div>

              <div>
                <h2>Location</h2>

                <p>
                  Verify your location
                </p>
              </div>

            </div>

            <GPSLocation
              onLocationReady={handleLocationReady}
            />

          </section>
        )}

        {/* =======================
            CAMERA SECTION
        ======================= */}

        {location && (
          <section className="section">

            <div className="section-title">

             

            

            </div>

            <Camera
              disabled={!location}
              onPhotoTaken={handlePhotoTaken}
            />

          </section>
        )}
        </div>
</div>
        {/* =======================
            SUBMIT
        ======================= */}

        {location && photo && (
         <button
  className="mark-attendance-button"
  onClick={submitAttendance}
>
  Mark Attendance
</button>
        )}

        {/* Footer */}

        <footer>
          <p>
            Your location and selfie are used
            for attendance verification.
          </p>
        </footer>

      </div>
    </div>
  );
}

export default App;