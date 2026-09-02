/**
 * camera-scanner.jsx
 *
 * Primary camera capture component for Frontend Developer 1.
 * Automatically scans every AUTO_SCAN_INTERVAL_MS (2 s) once the stream is live.
 * No manual trigger — the interval is paused while a scan is already in progress.
 *
 * Flow (repeats on interval):
 *   1. Capture frame from live video  → base64 JPEG
 *   2. Read GPS coordinates           → { latitude, longitude }
 *   3. Call mockIdentifyPlant(...)    → API response
 *   4. Fire onScanComplete(data)      → parent mounts <ArOverlay>
 *
 * Styling — strictly follows .antigravityrules §3:
 *   rounded-2xl / shadow-2xl  → floating AR camera overlay
 *   bg-primary / text-primary → primary branding
 *   bg-accent                 → rare / alert states
 *   text-muted-dark           → subtext / status labels
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import useCameraStream from "./use-camera-stream.js";
import useCaptureFrame from "./use-capture-frame.js";
import { mockIdentifyPlant } from "../../services/mock-vision-api.js";

/** How often (ms) the auto-scan fires when the stream is live. */
const AUTO_SCAN_INTERVAL_MS = 2000;

const SCAN_STATE = Object.freeze({
  IDLE: "idle",
  CAPTURING: "capturing",
  IDENTIFYING: "identifying",
  SUCCESS: "success",
  ERROR: "error",
});

/**
 * @param {{
 *   onScanComplete: (result: {
 *     identified_plant_id: string,
 *     confidence_score: number,
 *     is_native_to_region: boolean,
 *     requires_rare_highlight: boolean
 *   }) => void
 * }} props
 */
export default function CameraScanner({ onScanComplete }) {
  const { videoRef, isStreaming, streamError, startStream } = useCameraStream();
  const { captureFrame } = useCaptureFrame(videoRef);

  const [scanState, setScanState] = useState(SCAN_STATE.IDLE);
  const [scanError, setScanError] = useState(null);
  const [countdown, setCountdown] = useState(AUTO_SCAN_INTERVAL_MS / 1000);

  // Refs avoid stale-closure issues inside setInterval callbacks
  const isBusyRef = useRef(false);
  const intervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // ── Geolocation ────────────────────────────────────────────────────────────
  const getCurrentPosition = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported by this browser."));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        });
      }),
    []
  );

  // ── Core scan logic (called by interval) ───────────────────────────────────
  const runScan = useCallback(async () => {
    if (isBusyRef.current) return; // skip tick if previous scan still running
    isBusyRef.current = true;
    setScanError(null);

    try {
      setScanState(SCAN_STATE.CAPTURING);
      const imageData = await captureFrame();

      let captureLocation = { latitude: 0, longitude: 0 };
      try {
        const position = await getCurrentPosition();
        captureLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch {
        console.warn("CameraScanner: geolocation unavailable, using fallback coordinates.");
      }

      setScanState(SCAN_STATE.IDENTIFYING);
      const response = await mockIdentifyPlant({
        imageData,
        captureLocation,
        deviceTimestamp: new Date().toISOString(),
      });

      setScanState(SCAN_STATE.SUCCESS);
      onScanComplete?.(response.data);
    } catch (err) {
      setScanError(err.message ?? "An unknown error occurred.");
      setScanState(SCAN_STATE.ERROR);
    } finally {
      isBusyRef.current = false;
    }
  }, [captureFrame, getCurrentPosition, onScanComplete]);

  // ── Auto-scan interval ─────────────────────────────────────────────────────
  const resetCountdown = useCallback(() => {
    setCountdown(AUTO_SCAN_INTERVAL_MS / 1000);
  }, []);

  useEffect(() => {
    if (!isStreaming) return;

    // Fire the first scan immediately on stream start
    runScan();
    resetCountdown();

    // Repeat every AUTO_SCAN_INTERVAL_MS
    intervalRef.current = setInterval(() => {
      runScan();
      resetCountdown();
    }, AUTO_SCAN_INTERVAL_MS);

    // Tick the countdown display every second
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? AUTO_SCAN_INTERVAL_MS / 1000 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, [isStreaming, runScan, resetCountdown]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const isBusy =
    scanState === SCAN_STATE.CAPTURING || scanState === SCAN_STATE.IDENTIFYING;

  const statusLabel = (() => {
    if (streamError)                          return `Camera error: ${streamError.message}`;
    if (!isStreaming)                          return "Starting camera…";
    if (scanState === SCAN_STATE.CAPTURING)   return "Capturing frame…";
    if (scanState === SCAN_STATE.IDENTIFYING) return "Identifying species…";
    if (scanState === SCAN_STATE.SUCCESS)     return "Species identified!";
    if (scanState === SCAN_STATE.ERROR)       return scanError ?? "Scan failed.";
    return `Next scan in ${countdown}s`;
  })();

  // Progress fraction for the ring (0 → 1)
  const ringProgress = isBusy
    ? 1
    : 1 - countdown / (AUTO_SCAN_INTERVAL_MS / 1000);

  // SVG ring params
  const RADIUS = 36;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - ringProgress);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex flex-col items-center justify-end w-full h-full overflow-hidden rounded-2xl shadow-2xl bg-surface-dark">

      {/* Live video feed */}
      <video
        ref={videoRef}
        id="camera-scanner-video"
        className="absolute inset-0 object-cover w-full h-full"
        playsInline
        muted
      />

      {/* Viewfinder reticle — pulses while scanning */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-56 h-56 rounded-2xl border-2 border-primary transition-opacity duration-300 ${
            isBusy ? "opacity-100 scale-105" : "opacity-70"
          }`}
          style={{ transition: "opacity 0.3s, transform 0.3s" }}
        />
      </div>

      {/* Bottom HUD */}
      <div className="relative z-10 flex flex-col items-center gap-3 w-full p-6 bg-surface-dark bg-opacity-70 backdrop-blur-sm">

        {/* Status text */}
        <p
          className={`text-sm font-medium ${
            scanState === SCAN_STATE.ERROR ? "text-accent" : "text-muted-dark"
          }`}
        >
          {statusLabel}
        </p>

        {/* Auto-scan countdown ring */}
        {!streamError && isStreaming && (
          <div className="relative flex items-center justify-center">
            {/* Background track */}
            <svg width="88" height="88" className="absolute" aria-hidden="true">
              <circle
                cx="44"
                cy="44"
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted opacity-30"
              />
            </svg>

            {/* Progress arc */}
            <svg
              width="88"
              height="88"
              className="absolute -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="44"
                cy="44"
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                className={`transition-all duration-1000 ${
                  isBusy ? "text-accent" : "text-primary"
                }`}
              />
            </svg>

            {/* Centre icon / spinner */}
            <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-surface-dark bg-opacity-80">
              {isBusy ? (
                <svg
                  className="animate-spin w-7 h-7 text-accent"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-label="Scanning"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg
                  className="w-7 h-7 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-label="Camera active"
                >
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Retry button — only shown on stream error */}
        {!!streamError && (
          <button
            id="camera-scanner-retry-btn"
            onClick={startStream}
            className="px-4 py-2 rounded-xl bg-accent text-muted-light text-sm font-semibold shadow-md"
          >
            Retry Camera
          </button>
        )}
      </div>
    </div>
  );
}
