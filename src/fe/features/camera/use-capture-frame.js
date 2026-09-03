/**
 * use-capture-frame.js
 *
 * Extracts a single JPEG frame from a live <video> element:
 *  1. Draws the current video frame onto an off-screen <canvas>
 *  2. Reads the canvas as a base64 JPEG string (data-URI prefix stripped)
 *
 * Returns:
 *  captureFrame  – async () => string | null
 *                  Returns null (instead of throwing) when the video is not
 *                  yet ready — callers should skip the scan attempt gracefully.
 *  isCapturing   – true while the canvas draw is in progress
 */

import { useRef, useState, useCallback } from "react";

const JPEG_QUALITY = 0.8;
const MAX_DIMENSION = 512;

export default function useCaptureFrame(videoRef) {
  // Persistent off-screen canvas — reused on every capture
  const canvasRef = useRef(document.createElement("canvas"));
  const [isCapturing, setIsCapturing] = useState(false);

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;

    // Return null instead of throwing — callers skip gracefully.
    // readyState >= 2 (HAVE_CURRENT_DATA) means at least one frame is decoded.
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      return null;
    }

    setIsCapturing(true);
    try {
      let width = video.videoWidth;
      let height = video.videoHeight;

      // Scale down to prevent HTTP 413 Payload Too Large and improve latency
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, width, height);

      // Strip "data:image/png;base64," prefix — API expects raw base64
      const dataUrl = canvas.toDataURL("image/png");
      return dataUrl.split(",")[1];
    } finally {
      setIsCapturing(false);
    }
  }, [videoRef]);

  return { captureFrame, isCapturing };
}
