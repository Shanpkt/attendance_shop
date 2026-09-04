import React, { useEffect, useRef, useState } from "react";
import GPSLocation from "./components/GPSLocation";
import Camera from "./components/Camera";
import "./App.scss";

const API_URL = "https://attendance-backend-hs75.onrender.com/api/attendance";

function App() {
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);

  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");

  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [responseDialog, setResponseDialog] = useState({
    show: false,
    success: false,
    title: "",
    message: "",
    action: "",
  });

  const mobileInputRef = useRef(null);

  // --------------------------------------------------
  // CURRENT DATE
  // --------------------------------------------------

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-IN");
  };

  // --------------------------------------------------
  // LOCATION READY
  // --------------------------------------------------

  const handleLocationReady = (locationData) => {
    console.log("Location received:", locationData);
    setLocation(locationData);
  };

  // --------------------------------------------------
  // CAMERA PHOTO
  // --------------------------------------------------

  const handlePhotoTaken = (image) => {
    console.log("Photo captured");

    setPhoto(image);
    setShowMobileDialog(true);

    setTimeout(() => {
      mobileInputRef.current?.focus();
    }, 200);
  };

  // --------------------------------------------------
  // CHECK ATTENDANCE STATUS
  // --------------------------------------------------

  const checkAttendanceStatus = async (number) => {
    if (!/^\d{10}$/.test(number)) {
      setAttendanceStatus(null);
      return;
    }

    try {
      setCheckingStatus(true);

      const date = getCurrentDate();

      const response = await fetch(
        `${API_URL}/status/${number}?date=${encodeURIComponent(date)}`
      );

      const data = await response.json();

      console.log("Attendance status:", data);

      if (response.ok) {
        setAttendanceStatus(data);
      } else {
        setAttendanceStatus(null);
      }
    } catch (error) {
      console.error("Status check error:", error);
      setAttendanceStatus(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  // --------------------------------------------------
  // MOBILE NUMBER CHANGE
  // --------------------------------------------------

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);

    setMobileNumber(value);

    if (value.length === 10) {
      checkAttendanceStatus(value);
    } else {
      setAttendanceStatus(null);
    }
  };

  // --------------------------------------------------
  // DETERMINE BUTTON TEXT
  // --------------------------------------------------

  const getActionText = () => {
    if (checkingStatus) {
      return "Checking...";
    }

    if (!attendanceStatus || attendanceStatus.exists === false) {
      return "Punch In";
    }

    if (attendanceStatus.status === "Punched In") {
      return "Punch Out";
    }

    if (attendanceStatus.status === "Punched Out") {
      return "Completed";
    }

    return "Punch In";
  };

  // --------------------------------------------------
  // ACTION DESCRIPTION
  // --------------------------------------------------

  const getActionDescription = () => {
    if (checkingStatus) {
      return "Checking today's attendance...";
    }

    if (!attendanceStatus || attendanceStatus.exists === false) {
      return "You have not punched in today.";
    }

    if (attendanceStatus.status === "Punched In") {
      return "You are currently punched in. Submit again to punch out.";
    }

    if (attendanceStatus.status === "Punched Out") {
      return "Your attendance for today is already completed.";
    }

    return "";
  };

  // --------------------------------------------------
  // SUBMIT ATTENDANCE
  // --------------------------------------------------

  const submitAttendance = async () => {
    if (!mobileNumber) {
      showError("Please enter your mobile number.");
      return;
    }

    if (!/^\d{10}$/.test(mobileNumber)) {
      showError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!location) {
      showError("Location is not available. Please try again.");
      return;
    }

    if (!photo) {
      showError("Please capture your selfie.");
      return;
    }

    try {
      setSubmitting(true);

      const date = getCurrentDate();

      const attendanceData = {
        mobileNumber,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        date,
      };

      console.log("Sending attendance:", attendanceData);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attendanceData),
      });

      const data = await response.json();

      console.log("Attendance response:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to submit attendance."
        );
      }

      // ----------------------------------------------
      // SUCCESS
      // ----------------------------------------------

      const action = data.action || data.data?.status || "Attendance";

      setShowMobileDialog(false);

      setResponseDialog({
        show: true,
        success: true,
        title:
          action === "Punched In"
            ? "Punch In Successful"
            : "Punch Out Successful",
        message:
          action === "Punched In"
            ? "Your attendance has been successfully punched in."
            : "Your attendance has been successfully punched out.",
        action,
      });

      // Reset
      setMobileNumber("");
      setAttendanceStatus(null);
      setPhoto(null);
    } catch (error) {
      console.error("Attendance submission error:", error);

      showError(error.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // ERROR DIALOG
  // --------------------------------------------------

  const showError = (message) => {
    setResponseDialog({
      show: true,
      success: false,
      title: "Attendance Failed",
      message,
      action: "",
    });
  };

  // --------------------------------------------------
  // CLOSE RESPONSE
  // --------------------------------------------------

  const closeResponseDialog = () => {
    setResponseDialog({
      show: false,
      success: false,
      title: "",
      message: "",
      action: "",
    });
  };

  // --------------------------------------------------
  // CLOSE MOBILE DIALOG
  // --------------------------------------------------

  const closeMobileDialog = () => {
    if (submitting) return;

    setShowMobileDialog(false);
    setMobileNumber("");
    setAttendanceStatus(null);
    setPhoto(null);
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="attendance-app">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="attendance-header">
        <div className="header-content">

          <div className="logo-section">
            <div className="logo-icon">
              ✓
            </div>

            <div>
              <h1>Employee Attendance</h1>
              <p>Daily Attendance System</p>
            </div>
          </div>

          <div className="header-date">
            <span>Today</span>
            <strong>{getCurrentDate()}</strong>
          </div>

        </div>
      </header>


      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="attendance-main">

        {/* --------------------------------------------------
            STEP 1 - LOCATION
        -------------------------------------------------- */}

        <section className="attendance-card">

          <div className="card-header">

            <div className="step-number">
              1
            </div>

            <div>
              <h2>Verify Your Location</h2>
              <p>
                Your location must be verified before attendance.
              </p>
            </div>

          </div>

          <div className="location-container">

            <GPSLocation
              onLocationReady={handleLocationReady}
            />

          </div>

        </section>


        {/* --------------------------------------------------
            STEP 2 - CAMERA
        -------------------------------------------------- */}

        {location && (
          <section className="attendance-card">

            <div className="card-header">

              <div className="step-number">
                2
              </div>

              <div>
                <h2>Capture Selfie</h2>
                <p>
                  Take a clear selfie to verify your attendance.
                </p>
              </div>

            </div>

            <div className="camera-container">

              <Camera
                onPhotoTaken={handlePhotoTaken}
              />

            </div>

          </section>
        )}

      </main>


      {/* ==================================================
          MOBILE NUMBER DIALOG
      ================================================== */}

      {showMobileDialog && (
        <div className="dialog-overlay">

          <div className="mobile-dialog">

            {/* Header */}

            <div className="dialog-header">

              <div className="dialog-icon">
                📱
              </div>

              <div>
                <h2>Employee Verification</h2>

                <p>
                  Enter your registered mobile number
                </p>
              </div>

              <button
                className="close-button"
                onClick={closeMobileDialog}
                disabled={submitting}
              >
                ×
              </button>

            </div>


            {/* Body */}

            <div className="dialog-body">

              <label htmlFor="mobileNumber">
                Mobile Number
              </label>

              <div className="mobile-input-wrapper">

                <span className="country-code">
                  +91
                </span>

                <input
                  ref={mobileInputRef}
                  id="mobileNumber"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter 10 digit mobile number"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  disabled={submitting}
                />

              </div>


              {/* STATUS */}

              {mobileNumber.length === 10 && (
                <div className="attendance-status-box">

                  {checkingStatus ? (

                    <div className="status-loading">
                      <span className="spinner small"></span>
                      Checking attendance...
                    </div>

                  ) : !attendanceStatus ||
                    attendanceStatus.exists === false ? (

                    <div className="status-new">
                      <span className="status-icon">
                        ✓
                      </span>

                      <div>
                        <strong>Ready to Punch In</strong>
                        <p>
                          No attendance found for today.
                        </p>
                      </div>
                    </div>

                  ) : attendanceStatus.status === "Punched In" ? (

                    <div className="status-punched-in">

                      <span className="status-icon">
                        🟢
                      </span>

                      <div>
                        <strong>Already Punched In</strong>

                        <p>
                          Your next action will be Punch Out.
                        </p>
                      </div>

                    </div>

                  ) : (

                    <div className="status-completed">

                      <span className="status-icon">
                        ✓
                      </span>

                      <div>
                        <strong>Attendance Completed</strong>

                        <p>
                          You have already punched out today.
                        </p>
                      </div>

                    </div>

                  )}

                </div>
              )}


              {/* INFO */}

              <div className="attendance-info">

                <div className="info-row">
                  <span>📍</span>
                  <div>
                    <strong>Location</strong>
                    <small>
                      {location
                        ? "Verified"
                        : "Not available"}
                    </small>
                  </div>
                </div>


                <div className="info-row">
                  <span>📸</span>

                  <div>
                    <strong>Selfie</strong>

                    <small>
                      {photo
                        ? "Captured"
                        : "Not captured"}
                    </small>
                  </div>
                </div>


                <div className="info-row">
                  <span>📅</span>

                  <div>
                    <strong>Date</strong>

                    <small>
                      {getCurrentDate()}
                    </small>
                  </div>
                </div>

              </div>

            </div>


            {/* Footer */}

            <div className="dialog-footer">

              <button
                type="button"
                className="cancel-button"
                onClick={closeMobileDialog}
                disabled={submitting}
              >
                Cancel
              </button>


              <button
                type="button"
                className={`submit-button ${
                  attendanceStatus?.status === "Punched In"
                    ? "punch-out"
                    : ""
                }`}
                onClick={submitAttendance}
                disabled={
                  submitting ||
                  checkingStatus ||
                  mobileNumber.length !== 10 ||
                  attendanceStatus?.status === "Punched Out"
                }
              >

                {submitting ? (

                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>

                ) : (

                  <>
                    {getActionText()}
                    <span>→</span>
                  </>

                )}

              </button>

            </div>

          </div>

        </div>
      )}


      {/* ==================================================
          RESPONSE DIALOG
      ================================================== */}

      {responseDialog.show && (
        <div className="dialog-overlay">

          <div className="response-dialog">

            <div
              className={`response-icon ${
                responseDialog.success
                  ? "success"
                  : "error"
              }`}
            >

              {responseDialog.success ? "✓" : "!"}

            </div>


            <h2>
              {responseDialog.title}
            </h2>


            <p>
              {responseDialog.message}
            </p>


            {responseDialog.action && (
              <div className="action-result">

                <span>
                  Attendance Status
                </span>

                <strong>
                  {responseDialog.action}
                </strong>

              </div>
            )}


            <button
              className="response-button"
              onClick={closeResponseDialog}
            >
              Done
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default App;