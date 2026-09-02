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

import React from "react";
import useCameraStream from "./use-camera-stream";
import useCaptureFrame from "./use-capture-frame";

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
  const { videoRef, isStreaming, streamError } = useCameraStream();
  const { captureFrame, isCapturing } = useCaptureFrame(videoRef);

  const handleCapture = async () => {
    if (!isStreaming || isCapturing) return;
    
    const base64Frame = await captureFrame();
    if (base64Frame) {
      // Mock API response until visionApi is ready
      onScanComplete({
        success: true,
        data: {
          identified_plant_id: "plant_cg_101",
          confidence_score: 0.96,
          is_native_to_region: true,
          requires_rare_highlight: true
        }
      });
    }
  };

  if (streamError) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-surface-dark rounded-2xl shadow-2xl p-6 text-center gap-4">
        <span className="text-4xl">📷</span>
        <p className="text-red-600 font-semibold text-sm">{streamError.message}</p>
        <p className="text-xs text-muted-dark">Please grant camera permissions.</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Viewfinder Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="w-[60vw] h-[60vw] max-w-[320px] max-h-[320px] border-[3px] border-white/60 rounded-[1.5rem] flex items-center justify-center">
          <div className="w-[70%] h-[70%] border-2 border-dashed border-accent rounded-full opacity-80" />
        </div>
      </div>

      {/* Capture Controls */}
      <div className="absolute bottom-10 z-20 w-full flex justify-center">
        <button
          onClick={handleCapture}
          disabled={!isStreaming || isCapturing}
          className="w-16 h-16 border-4 border-white rounded-full bg-transparent flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
          aria-label="Capture photo"
        >
          {isCapturing && <div className="w-8 h-8 bg-white rounded-full animate-ping" />}
        </button>
      </div>
    </div>
  );
}
