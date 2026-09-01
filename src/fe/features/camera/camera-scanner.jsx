/**
 * camera-scanner.jsx
 *
 * Primary camera capture component for Frontend Developer 1.
 * Owns WebRTC stream lifecycle and triggers the vision identification flow.
 *
 * Responsibilities:
 *  - Request and render the device camera feed via WebRTC (navigator.mediaDevices)
 *  - Capture a frame from the live stream as a base64 string
 *  - Call the vision service (vision_api.js) with the captured frame + GPS location
 *  - Expose scan results upward via the onScanComplete callback prop
 *
 * TODO (implementation phase):
 *  - Wire useCameraStream hook for stream management
 *  - Wire useCaptureFrame hook for canvas-based frame extraction
 *  - Replace mockIdentifyPlant with the real visionApi.identifyPlant call
 */

import React from "react";

/**
 * @param {{ onScanComplete: (result: Object) => void }} props
 */
export default function CameraScanner({ onScanComplete }) {
  // Placeholder — implementation follows in useCameraStream / useCaptureFrame
  return (
    <div className="relative flex items-center justify-center w-full h-full bg-surface-dark rounded-2xl shadow-2xl">
      <p className="text-muted-dark">CameraScanner — scaffold placeholder</p>
    </div>
  );
}
