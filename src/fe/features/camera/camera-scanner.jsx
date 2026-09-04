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
import PlantDetailSheet from "./plant-detail-sheet.jsx";

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
const RING_SIZE = 64;
const RADIUS = 28;
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
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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

  // Pause the auto-resume countdown while the detail sheet is open
  useEffect(() => {
    if (isDetailOpen) {
      // Cancel any pending auto-resume while user is reading the detail sheet
      clearTimeout(autoResumeTimerRef.current);
    } else if (scanState === SCAN_STATE.SUCCESS) {
      // Re-arm the auto-resume when the sheet is closed (fresh 8 s window)
      autoResumeTimerRef.current = setTimeout(() => {
        resumeScanning();
      }, AUTO_RESUME_MS);
    }
    return () => clearTimeout(autoResumeTimerRef.current);
  }, [isDetailOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <style>{`
        @keyframes scan-laser {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(16rem); opacity: 0; }
        }
        @keyframes pop-in {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
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
          className="relative w-64 h-64"
          style={{
            opacity: isBusy ? 1 : 0.6,
            transform: isBusy ? "scale(1.02)" : "scale(1)",
            transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.17, 0.67, 0.16, 0.99)",
          }}
        >
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 rounded-tl-3xl border-primary" style={{ filter: isBusy ? 'drop-shadow(0 0 8px rgba(22, 101, 52, 0.8))' : 'none', transition: 'filter 0.3s' }} />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 rounded-tr-3xl border-primary" style={{ filter: isBusy ? 'drop-shadow(0 0 8px rgba(22, 101, 52, 0.8))' : 'none', transition: 'filter 0.3s' }} />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 rounded-bl-3xl border-primary" style={{ filter: isBusy ? 'drop-shadow(0 0 8px rgba(22, 101, 52, 0.8))' : 'none', transition: 'filter 0.3s' }} />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 rounded-br-3xl border-primary" style={{ filter: isBusy ? 'drop-shadow(0 0 8px rgba(22, 101, 52, 0.8))' : 'none', transition: 'filter 0.3s' }} />
          
          {/* Scanning laser line */}
          {isBusy && (
            <div 
              className="absolute left-0 right-0 h-1 bg-primary rounded-full shadow-[0_0_15px_3px_rgba(22,101,52,0.8)]"
              style={{
                animation: 'scan-laser 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                top: 0
              }}
            />
          )}
        </div>
      </div>

      {/* ── AR Overlay: minimal tappable name chip ── */}
      {scanState === SCAN_STATE.SUCCESS && identifyResult && (
        <div
          className="absolute inset-x-6 top-48 z-20 flex justify-center pointer-events-auto"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            transition: "transform 0.2s ease-out",
          }}
        >
          <button
            id="ar-plant-name-chip"
            onClick={() => setIsDetailOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.3)]"
            style={{
              backdropFilter: "blur(20px)",
              background: "rgba(20, 31, 24, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              fontFamily: "'Inter', sans-serif",
              animation: "pop-in 0.4s cubic-bezier(0.17, 0.67, 0.16, 0.99)",
            }}
            aria-label="View plant details"
          >
            <span className="text-base">🌿</span>
            <span className="text-sm font-semibold text-muted-light">
              {arMetadata?.common_name ?? "Unknown Species"}
            </span>
            {identifyResult.requires_rare_highlight && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-xl bg-accent text-muted-light">
                RARE
              </span>
            )}
            {/* Tap indicator */}
            <span className="text-xs text-muted-dark ml-1">›</span>
          </button>
        </div>
      )}

      {/* ── Bottom HUD ────────────────────────────────────────────────────── */}
      <div className="absolute bottom-8 left-6 right-6 z-10 flex flex-col items-center gap-3 px-6 py-5 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

        <p
          className={`text-xs font-bold tracking-widest uppercase ${
            scanState === SCAN_STATE.ERROR ? "text-accent" : "text-white/90"
          }`}
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
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
              style={{ width: 44, height: 44 }}
            >
              {isBusy ? (
                <svg className="animate-spin text-accent" style={{ width: 22, height: 22 }}
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Scanning">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="text-primary" style={{ width: 22, height: 22 }}
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth={2.5}
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
      {/* Plant Detail Sheet */}
      <PlantDetailSheet
        arMetadata={arMetadata}
        identifyResult={identifyResult}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}


