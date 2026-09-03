/**
 * camera-scanner.jsx
 *
 * Primary camera capture component for Frontend Developer 1.
 *
 * Behaviour:
 *  - Renders as a fullscreen fixed overlay (z-50); never closes itself.
 *  - Auto-scans every 2 s while the stream is live.
 *  - On a successful identification, shows the result as an inline card
 *    overlaid on the camera feed (placeholder for AR overlay).
 *  - onScanComplete is deliberately NOT fired on identification.
 *    It fires only when the user taps "Continue Scanning" (explicit dismissal).
 *    This prevents any parent callback handler from closing the camera
 *    automatically mid-session.
 *  - Scanning resumes automatically after the user dismisses the result card,
 *    OR after AUTO_RESUME_MS if they do nothing.
 *  - onScanComplete is still fired so the parent (Dashboard context) can log
 *    the discovery for gamification without needing to close the camera.
 *
 * Styling — strictly follows .antigravityrules §3:
 *   rounded-2xl / shadow-2xl  → floating panels
 *   bg-primary / text-primary → primary branding
 *   bg-accent                 → rare / alert badges
 *   text-muted-dark           → subtext / status labels
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import useCameraStream from "./use-camera-stream.js";
import useCaptureFrame from "./use-capture-frame.js";
import useArTracking from "./use-ar-tracking.js";
import { identifyPlant, getArMetadata } from "../../services/vision_api.js";

/** Auto-scan interval (ms). */
const AUTO_SCAN_INTERVAL_MS = 2000;

/** How long (ms) the result card stays visible before auto-resuming scans. */
const AUTO_RESUME_MS = 8000;

const SCAN_STATE = Object.freeze({
  IDLE: "idle",
  CAPTURING: "capturing",
  IDENTIFYING: "identifying",
  SUCCESS: "success",    // result card shown, scanning paused
  ERROR: "error",
});

// SVG ring constants
const RING_SIZE = 88;
const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * @param {{
 *   onScanComplete?: (result: {
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
  const { offset, requestPermission } = useArTracking(scanState === SCAN_STATE.SUCCESS);
  const [scanError, setScanError] = useState(null);
  const [countdown, setCountdown] = useState(AUTO_SCAN_INTERVAL_MS / 1000);

  /** The `data` object from the last successful /vision/identify response. */
  const [identifyResult, setIdentifyResult] = useState(null);

  /**
   * Full AR metadata fetched from /plants/:id/ar-metadata.
   * Shown on the inline result card until AR overlay is implemented.
   */
  const [arMetadata, setArMetadata] = useState(null);

  const isBusyRef = useRef(false);
  const intervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const autoResumeTimerRef = useRef(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const clearAllTimers = useCallback(() => {
    clearInterval(intervalRef.current);
    clearInterval(countdownIntervalRef.current);
    clearTimeout(autoResumeTimerRef.current);
  }, []);

  const getCurrentPosition = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported."));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        });
      }),
    []
  );

  // ── Scanning ───────────────────────────────────────────────────────────────

  const runScan = useCallback(async () => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    setScanError(null);

    try {
      setScanState(SCAN_STATE.CAPTURING);
      const imageData = await captureFrame();

      // captureFrame returns null when the video isn't ready yet — skip silently
      if (imageData === null) {
        setScanState(SCAN_STATE.IDLE);
        return;
      }

      let captureLocation = { latitude: 0, longitude: 0 };
      try {
        const position = await getCurrentPosition();
        captureLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch {
        console.warn("CameraScanner: geolocation unavailable, using fallback.");
      }

      setScanState(SCAN_STATE.IDENTIFYING);
      const response = await identifyPlant({
        imageData,
        captureLocation,
        deviceTimestamp: new Date().toISOString(),
      });

      const resultData = response.data;
      setIdentifyResult(resultData);

      // Also fetch AR metadata so we can show plant details on the card
      try {
        const meta = await getArMetadata(resultData.identified_plant_id);
        setArMetadata(meta.data);
      } catch {
        setArMetadata(null);
      }

      setScanState(SCAN_STATE.SUCCESS);

      // Fire immediately so the parent (dashboard) gets the result for gamification.
      // The dashboard's handleScanComplete no longer automatically closes the camera.
      onScanComplete?.(resultData);
    } catch (err) {
      setScanError(err.message ?? "An unknown error occurred.");
      setScanState(SCAN_STATE.ERROR);
    } finally {
      isBusyRef.current = false;
    }
  }, [captureFrame, getCurrentPosition, onScanComplete]);

  // ── Interval management ────────────────────────────────────────────────────

  const startScanningInterval = useCallback(() => {
    clearAllTimers();
    setCountdown(AUTO_SCAN_INTERVAL_MS / 1000);

    intervalRef.current = setInterval(() => {
      runScan();
      setCountdown(AUTO_SCAN_INTERVAL_MS / 1000);
    }, AUTO_SCAN_INTERVAL_MS);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? AUTO_SCAN_INTERVAL_MS / 1000 : prev - 1));
    }, 1000);
  }, [clearAllTimers, runScan]);

  /**
   * Resumes scanning automatically after AUTO_RESUME_MS elapses.
   */
  const resumeScanning = useCallback(() => {
    setIdentifyResult(null);
    setArMetadata(null);
    setScanState(SCAN_STATE.IDLE);
    startScanningInterval();
  }, [startScanningInterval]);

  // Start scanning as soon as the stream is live
  useEffect(() => {
    if (!isStreaming) return;

    runScan();
    startScanningInterval();

    return () => clearAllTimers();
  }, [isStreaming]); // eslint-disable-line react-hooks/exhaustive-deps

  // When SUCCESS state is entered, pause interval and set auto-resume timer
  useEffect(() => {
    if (scanState !== SCAN_STATE.SUCCESS) return;

    clearInterval(intervalRef.current);
    clearInterval(countdownIntervalRef.current);

    autoResumeTimerRef.current = setTimeout(() => {
      resumeScanning();
    }, AUTO_RESUME_MS);

    return () => clearTimeout(autoResumeTimerRef.current);
  }, [scanState]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived display values ─────────────────────────────────────────────────

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

  const ringProgress = isBusy ? 1 : 1 - countdown / (AUTO_SCAN_INTERVAL_MS / 1000);
  const strokeDashoffset = CIRCUMFERENCE * (1 - ringProgress);
  const arcColor = isBusy ? "var(--color-accent, #d97706)" : "var(--color-primary, #166534)";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-end overflow-hidden bg-black"
      style={{ fontFamily: "'Inter', sans-serif" }}
      onClick={requestPermission}
    >
      {/* Live video feed */}
      <video
        ref={videoRef}
        id="camera-scanner-video"
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Viewfinder reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-56 h-56 rounded-2xl border-2 border-primary"
          style={{
            opacity: isBusy ? 1 : 0.7,
            transform: isBusy ? "scale(1.05)" : "scale(1)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        />
      </div>

      {/* ── AR Overlay Result Card ── */}
      {scanState === SCAN_STATE.SUCCESS && identifyResult && (
        <div className="absolute inset-x-4 top-48 z-20 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
          style={{ 
            backdropFilter: "blur(16px)", 
            background: "rgba(0,0,0,0.75)",
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            transition: "transform 0.1s ease-out"
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌿</span>
              <span className="text-sm font-semibold text-muted-light">
                {arMetadata?.common_name ?? "Unknown Species"}
              </span>
            </div>
            {identifyResult.requires_rare_highlight && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-xl bg-accent text-muted-light">
                RARE
              </span>
            )}
          </div>

          <div className="px-4 pb-2">
            <p className="text-xs text-muted-dark italic">
              {arMetadata?.scientific_name ?? identifyResult.identified_plant_id}
            </p>
          </div>

          {/* Details grid */}
          {arMetadata && (
            <div className="px-4 pb-3 flex flex-col gap-1">
              <InfoRow label="Family"  value={arMetadata.plant_family} />
              <InfoRow label="Region"  value={arMetadata.native_region} />
              <InfoRow label="Status"  value={arMetadata.conservation_status} highlight />
              <InfoRow
                label="Confidence"
                value={`${(identifyResult.confidence_score * 100).toFixed(0)}%`}
              />
            </div>
          )}

          {/* Ecological importance snippet */}
          {arMetadata?.ecological_importance && (
            <p className="px-4 pb-3 text-xs text-muted-dark leading-relaxed line-clamp-2">
              {arMetadata.ecological_importance}
            </p>
          )}
        </div>
      )}

      {/* ── Bottom HUD ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-4 w-full px-6 py-8 bg-black bg-opacity-50 backdrop-blur-md">

        <p
          className={`text-sm font-medium tracking-wide ${
            scanState === SCAN_STATE.ERROR ? "text-accent" : "text-muted-dark"
          }`}
        >
          {statusLabel}
        </p>

        {/* Countdown ring — shown only while actively scanning */}
        {!streamError && isStreaming && scanState !== SCAN_STATE.SUCCESS && (
          <div
            className="relative flex items-center justify-center"
            style={{ width: RING_SIZE, height: RING_SIZE, flexShrink: 0 }}
          >
            <svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
              aria-hidden="true"
            >
              <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                fill="none" stroke="#9ca3af" strokeWidth="4" opacity="0.3" />
              <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                fill="none" stroke={arcColor} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
              />
            </svg>

            <div
              className="relative z-10 flex items-center justify-center rounded-xl bg-black bg-opacity-60"
              style={{ width: 56, height: 56 }}
            >
              {isBusy ? (
                <svg className="animate-spin text-accent" style={{ width: 28, height: 28 }}
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Scanning">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="text-primary" style={{ width: 28, height: 28 }}
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round" aria-label="Camera active">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Retry button — stream error only */}
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

// ── Sub-components ──────────────────────────────────────────────────────────

function InfoRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-dark">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? "text-accent" : "text-muted-light"}`}>
        {value}
      </span>
    </div>
  );
}
