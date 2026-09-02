/**
 * use-capture-frame.js
 *
 * Extracts a single JPEG frame from a live <video> element:
 *  1. Draws the current video frame onto an off-screen <canvas>
 *  2. Reads the canvas as a base64 JPEG string (data-URI prefix stripped)
 *
 * Returns:
 *  captureFrame  – async () => string (base64 JPEG, no prefix)
 *  isCapturing   – true while the canvas draw is in progress
 */

import { useRef, useState, useCallback } from "react";

const JPEG_QUALITY = 0.9;

export default function useCaptureFrame(videoRef) {
  const canvasRef = useRef(document.createElement("canvas"));
  const [isCapturing, setIsCapturing] = useState(false);

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      throw new Error("captureFrame: video element is not ready.");
    }

    setIsCapturing(true);
    try {
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Strip "data:image/jpeg;base64," prefix — API expects raw base64
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      return dataUrl.split(",")[1];
    } finally {
      setIsCapturing(false);
    }
  }, [videoRef]);

  return { captureFrame, isCapturing };
}
