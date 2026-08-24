import React, { useState } from "react";

import GPSLocation from "./gps";
import Camera from "./camera";

import "./App.scss";

function App() {
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);

  const [showMobileForm, setShowMobileForm] =
    useState(false);

  const [mobileNumber, setMobileNumber] =
    useState("");

  const handleLocationReady = (locationData) => {
    console.log(
      "Location received in App:",
      locationData
    );

    setLocation(locationData);
  };

  const handlePhotoTaken = (image) => {
    console.log(
      "Photo received in App:",
      image
    );

    setPhoto(image);

    // Photo submitted from Camera
    if (image) {
      setShowMobileForm(true);
    }
  };

  const submitAttendance = () => {
    if (!mobileNumber) {
      alert("Please enter mobile number.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      alert("Please enter a valid 10 digit mobile number.");
      return;
    }

    if (!location) {
      alert("Location is not ready.");
      return;
    }

    if (!photo) {
      alert("Please take your selfie.");
      return;
    }

    const now = new Date();

    const attendanceData = {
      mobileNumber: mobileNumber,

      selfie: photo,

      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,

      timestamp: now.toISOString(),

      date: now.toLocaleDateString("en-IN"),

      time: now.toLocaleTimeString("en-IN"),
    };

    console.log(
      "========== FINAL ATTENDANCE JSON =========="
    );

    console.log(
      JSON.stringify(
        attendanceData,
        null,
        2
      )
    );

    console.log(
      "==========================================="
    );

    alert("Attendance submitted successfully!");

    setShowMobileForm(false);
  };

  return (
    <div className="home">

      <div className="attendance-card">

        {/* HEADER */}

        <header className="header">
          <div>
            <h1 className="attendace_text">
              Attendance
            </h1>
          </div>
        </header>

        {/* GPS */}

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
                  onLocationReady={
                    handleLocationReady
                  }
                />

              </section>
            )}

            {/* CAMERA */}

            {location && (
              <section className="section">

                <Camera
                  disabled={!location}
                  onPhotoTaken={
                    handlePhotoTaken
                  }
                />

              </section>
            )}

            {/* MOBILE NUMBER */}

            {showMobileForm && photo && (
              <div className="mobile-number-box">

                <h3>
                  Enter Mobile Number
                </h3>

                <p>
                  Enter your registered mobile
                  number to submit attendance.
                </p>

                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) =>
                    setMobileNumber(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  placeholder="Enter 10 digit mobile number"
                  maxLength={10}
                />

                <button
                  type="button"
                  className="mark-attendance-button"
                  onClick={submitAttendance}
                >
                  Submit Attendance
                </button>

              </div>
            )}

          </div>

        </div>

        {/* FOOTER */}

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