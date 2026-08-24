import React, { useState } from "react";

import GPSLocation from "./gps";
import Camera from "./camera";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

import axios from "axios";

import "./App.scss";

function App() {
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);

  // Mobile number popup
  const [openMobileDialog, setOpenMobileDialog] =
    useState(false);

  const [mobileNumber, setMobileNumber] =
    useState("");

  // ==========================================
  // GPS LOCATION RECEIVED
  // ==========================================

  const handleLocationReady = (locationData) => {
    console.log(
      "Location received in App:",
      locationData
    );

    setLocation(locationData);
  };

  // ==========================================
  // PHOTO RECEIVED
  // ==========================================

  const handlePhotoTaken = (image) => {
    console.log(
      "Photo received in App:",
      image
    );

    setPhoto(image);

    // Open Material UI popup
    if (image) {
      setOpenMobileDialog(true);
    }
  };

  // ==========================================
  // SUBMIT ATTENDANCE
  // ==========================================

  const submitAttendance = async () => {

    // Check mobile number
    if (!mobileNumber) {
      alert("Please enter mobile number.");
      return;
    }

    // Validate mobile number
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      alert(
        "Please enter a valid 10 digit mobile number."
      );
      return;
    }

    // Check location
    if (!location) {
      alert("Location is not ready.");
      return;
    }

    // Check photo
    if (!photo) {
      alert("Please take your selfie.");
      return;
    }

    // ==========================================
    // CREATE DATE & TIME
    // ==========================================

    const now = new Date();

    // ==========================================
    // ATTENDANCE JSON
    // ==========================================

    const attendanceData = {
      mobileNumber: mobileNumber,

      // Uncomment this when you want
      // to send the image also.
      // selfie: photo,

      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,

      date: now.toLocaleDateString("en-IN"),
      time: now.toLocaleTimeString("en-IN"),
    };

    // ==========================================
    // SHOW JSON IN CONSOLE
    // ==========================================

    console.log(
      "========== FINAL ATTENDANCE =========="
    );

    console.log(
      JSON.stringify(
        attendanceData,
        null,
        2
      )
    );

    console.log(
      "======================================="
    );

    // ==========================================
    // AXIOS POST
    // ==========================================

    try {

      const response = await axios.post(
        "http://localhost:5000/api/attendance",
        attendanceData
      );

      // Backend response
      console.log(
        "Backend response:",
        response.data
      );

      // Close popup
      setOpenMobileDialog(false);

      // Clear mobile number
      setMobileNumber("");

      alert(
        "Attendance submitted successfully!"
      );

    } catch (error) {

      console.error(
        "Attendance submission error:",
        error
      );

      // Backend error response
      if (error.response) {

        console.error(
          "Server response:",
          error.response.data
        );

      }

      alert(
        "Unable to submit attendance. Please try again."
      );
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="home">

      <div className="attendance-card">

        {/* =====================================
            HEADER
        ===================================== */}

        <header className="header">

          <div>

            <h1 className="attendace_text">
              Attendance
            </h1>

          </div>

        </header>

        {/* =====================================
            GPS
        ===================================== */}

        <div className="main_section">

          <div className="center_box">

            {!location && (

              <section className="section">

                <div className="section-title">

                  <div className="icon gps-icon">
                    📍
                  </div>

                  <div>

                    <h2>
                      Location
                    </h2>

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

            {/* =====================================
                CAMERA
            ===================================== */}

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

          </div>

        </div>

        {/* =====================================
            FOOTER
        ===================================== */}

        <footer>

          <p>
            Your location and selfie are used
            for attendance verification.
          </p>

        </footer>

      </div>

      {/* =========================================
          MATERIAL UI MOBILE NUMBER POPUP
      ========================================= */}

      <Dialog
        open={openMobileDialog}
        onClose={() =>
          setOpenMobileDialog(false)
        }
        fullWidth
        maxWidth="xs"
      >

        {/* TITLE */}

        <DialogTitle>
          Submit Attendance
        </DialogTitle>

        {/* CONTENT */}

        <DialogContent>

          <p>
            Enter your mobile number to
            complete attendance.
          </p>

          <TextField
            autoFocus
            fullWidth
            label="Mobile Number"
            placeholder="Enter 10 digit mobile number"
            type="tel"
            value={mobileNumber}
            onChange={(e) => {

              const value =
                e.target.value.replace(
                  /\D/g,
                  ""
                );

              setMobileNumber(value);

            }}
            inputProps={{
              maxLength: 10,
            }}
            margin="normal"
          />

        </DialogContent>

        {/* BUTTONS */}

        <DialogActions>

          <Button
            onClick={() =>
              setOpenMobileDialog(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={submitAttendance}
          >
            Submit
          </Button>

        </DialogActions>

      </Dialog>

    </div>
  );
}

export default App;