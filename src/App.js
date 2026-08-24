import React, { useState } from "react";

import GPSLocation from "./gps";
import Camera from "./camera";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import axios from "axios";

import "./App.scss";

function App() {
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);

  const [openMobileDialog, setOpenMobileDialog] =
    useState(false);

  const [mobileNumber, setMobileNumber] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [responseStatus, setResponseStatus] =
    useState(null);

  // Used to reset Camera component
  const [cameraResetKey, setCameraResetKey] =
    useState(0);

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

    if (image) {
      setResponseStatus(null);
      setOpenMobileDialog(true);
    }
  };

  // ==========================================
  // RESET AFTER SUCCESS
  // ==========================================

  const resetAttendance = () => {
    // Close dialog
    setOpenMobileDialog(false);

    // Clear photo
    setPhoto(null);

    // Clear mobile number
    setMobileNumber("");

    // Clear backend response
    setResponseStatus(null);

    // Reset Camera component
    setCameraResetKey(
      (previousKey) => previousKey + 1
    );
  };

  // ==========================================
  // SUBMIT ATTENDANCE
  // ==========================================

  const submitAttendance = async () => {

    if (!mobileNumber) {
      setResponseStatus({
        type: "error",
        message: "Please enter mobile number.",
      });

      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setResponseStatus({
        type: "error",
        message:
          "Please enter a valid 10 digit mobile number.",
      });

      return;
    }

    if (!location) {
      setResponseStatus({
        type: "error",
        message: "Location is not ready.",
      });

      return;
    }

    if (!photo) {
      setResponseStatus({
        type: "error",
        message: "Please take your selfie.",
      });

      return;
    }

    const now = new Date();

    const attendanceData = {
      mobileNumber: mobileNumber,

      // selfie: photo,

      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,

      date: now.toLocaleDateString("en-IN"),
      time: now.toLocaleTimeString("en-IN"),
    };

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

    setSubmitting(true);
    setResponseStatus(null);

    try {

      const response = await axios.post(
        "https://attendance-backend-hs75.onrender.com/api/attendance",
        attendanceData
      );

      console.log(
        "Backend response:",
        response.data
      );

      setResponseStatus({
        type: "success",
        message:
          response.data.message ||
          "Attendance submitted successfully.",
        data:
          response.data.data ||
          attendanceData,
      });

      setMobileNumber("");

    } catch (error) {

      console.error(
        "Attendance submission error:",
        error
      );

      if (error.response) {

        setResponseStatus({
          type: "error",
          message:
            error.response.data?.message ||
            "Server returned an error.",
          data:
            error.response.data,
        });

      } else {

        setResponseStatus({
          type: "error",
          message:
            "Unable to connect to the server.",
        });

      }

    } finally {

      setSubmitting(false);

    }
  };

  // ==========================================
  // UI
  // ==========================================

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

            {/* CAMERA */}

            {location && (

              <section className="section">

                <Camera
                  key={cameraResetKey}
                  disabled={!location}
                  onPhotoTaken={
                    handlePhotoTaken
                  }
                />

              </section>

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

      {/* =========================================
          MATERIAL UI DIALOG
      ========================================= */}

      <Dialog
        open={openMobileDialog}
        onClose={() => {

          if (!submitting) {
            setOpenMobileDialog(false);
          }

        }}
        fullWidth
        maxWidth="xs"
      >

        <DialogTitle>

          {responseStatus ? (

            responseStatus.type ===
            "success" ? (

              <Typography
                variant="h6"
                sx={{
                  color: "green",
                  fontWeight: "bold",
                }}
              >
                ✓ Attendance Successful
              </Typography>

            ) : (

              <Typography
                variant="h6"
                sx={{
                  color: "red",
                  fontWeight: "bold",
                }}
              >
                ✕ Submission Failed
              </Typography>

            )

          ) : (

            "Submit Attendance"

          )}

        </DialogTitle>

        <DialogContent>

          {/* MOBILE FORM */}

          {!responseStatus && (

            <>
              <Typography
                variant="body2"
                sx={{ mb: 1 }}
              >
                Enter your mobile number to
                complete attendance.
              </Typography>

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
            </>

          )}

          {/* BACKEND RESPONSE */}

          {responseStatus && (

            <Box>

              <Typography
                variant="body1"
                sx={{
                  fontWeight: "bold",
                  mb: 2,
                  color:
                    responseStatus.type ===
                    "success"
                      ? "green"
                      : "red",
                }}
              >
                {responseStatus.message}
              </Typography>

              {responseStatus.data && (

                <Box
                  sx={{
                    backgroundColor:
                      "#f5f5f5",
                    padding: 2,
                    borderRadius: 2,
                  }}
                >

                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1 }}
                  >
                    Data Received
                  </Typography>

                  <pre
                    style={{
                      margin: 0,
                      whiteSpace:
                        "pre-wrap",
                      wordBreak:
                        "break-word",
                      fontSize: "13px",
                    }}
                  >
                    {JSON.stringify(
                      responseStatus.data,
                      null,
                      2
                    )}
                  </pre>

                </Box>

              )}

            </Box>

          )}

        </DialogContent>

        {/* BUTTONS */}

        <DialogActions>

          {!responseStatus && (

            <>
              <Button
                onClick={() =>
                  setOpenMobileDialog(false)
                }
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={submitAttendance}
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit"}
              </Button>
            </>

          )}

          {/* SUCCESS / ERROR CLOSE */}

          {responseStatus && (

            <Button
              variant="contained"
              onClick={() => {

                if (
                  responseStatus.type ===
                  "success"
                ) {
                  resetAttendance();
                } else {
                  setResponseStatus(null);
                }

              }}
            >
              Close
            </Button>

          )}

        </DialogActions>

      </Dialog>

    </div>
  );
}

export default App;