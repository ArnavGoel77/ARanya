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
    if (!videoRef.current) return null;
    
    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      
      // Return base64 string without the prefix
      return dataUrl.split(",")[1];
    } finally {
      setIsCapturing(false);
    }
  }, [videoRef]);

  return { captureFrame, isCapturing };
}
