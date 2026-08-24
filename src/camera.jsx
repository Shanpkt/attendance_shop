import React, { useEffect, useRef, useState } from "react";
import "./App.scss";

function Camera({ disabled, onPhotoTaken }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");

  const openCamera = async () => {
    if (disabled) return;

    try {
      setCameraLoading(true);
      setError("");

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
          },
          audio: false,
        });

      streamRef.current = mediaStream;

      setCameraOn(true);
      setCameraLoading(false);
    } catch (err) {
      console.error("Camera error:", err);

      setCameraLoading(false);
      setCameraOn(false);

      setError(
        "Unable to access camera. Please allow camera permission."
      );
    }
  };

  useEffect(() => {
    if (
      cameraOn &&
      videoRef.current &&
      streamRef.current
    ) {
      videoRef.current.srcObject =
        streamRef.current;
    }
  }, [cameraOn]);

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setError("Camera is not ready yet.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const image = canvas.toDataURL(
      "image/jpeg",
      0.9
    );

    setPhoto(image);

    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
  };

  const retakePhoto = () => {
    setPhoto(null);

    if (onPhotoTaken) {
      onPhotoTaken(null);
    }

    setTimeout(() => {
      openCamera();
    }, 100);
  };

  // SEND PHOTO TO APP
  const submitPhoto = () => {
    if (!photo) return;

    if (onPhotoTaken) {
      onPhotoTaken(photo);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }
    };
  }, []);

  return (
    <div className="camera-wrapper">

      {/* LIVE CAMERA */}

      {cameraOn && (
        <div className="camera-box">

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-media"
          />

          <div className="camera-overlay"></div>

          <div className="face-frame">
            <span className="corner top-left"></span>
            <span className="corner top-right"></span>
            <span className="corner bottom-left"></span>
            <span className="corner bottom-right"></span>
          </div>

          <div className="camera-bottom-gradient"></div>

          <button
            type="button"
            className="capture-button"
            onClick={takePhoto}
          >
            <span className="capture-icon"></span>
            Take Photo
          </button>

        </div>
      )}

      {/* PHOTO PREVIEW */}

      {photo && !cameraOn && (
        <div className="camera-box">

          <img
            src={photo}
            alt="Captured selfie"
            className="camera-media"
          />

          <div className="preview-overlay"></div>

          <div className="photo-actions">

            <button
              type="button"
              className="retake-button"
              onClick={retakePhoto}
            >
              ↻ Retake
            </button>

            <button
              type="button"
              className="submit-button"
              onClick={submitPhoto}
            >
              ✓ Submit
            </button>

          </div>

        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="error-box">

          <strong>
            Camera unavailable
          </strong>

          <p>{error}</p>

          <button
            type="button"
            className="try-again-button"
            onClick={() => {
              setError("");
              openCamera();
            }}
          >
            Try Again
          </button>

        </div>
      )}

      {/* INITIAL BUTTON */}

      {!cameraOn &&
        !photo &&
        !cameraLoading && (
          <button
            type="button"
            className="camera_primary-button"
            onClick={openCamera}
            disabled={disabled}
          >
            📷 Click Photo
          </button>
        )}

      {/* LOADING */}

      {cameraLoading && (
        <button
          type="button"
          className="primary-button"
          disabled
        >
          Opening Camera...
        </button>
      )}

      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
      />

    </div>
  );
}

export default Camera;