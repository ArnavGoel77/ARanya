/**
 * use-capture-frame.js
 *
 * Custom React hook — extracts a single JPEG frame from a live <video> element
 * by drawing it onto an off-screen <canvas> and returning a base64 data URL.
 *
 * Returns:
 *  - captureFrame : async () => string — resolves with base64 JPEG data
 *  - isCapturing  : boolean — true while the canvas draw is in progress
 *
 * TODO (implementation phase):
 *  - Accept videoRef as a parameter
 *  - Draw videoRef.current to a canvas via CanvasRenderingContext2D.drawImage
 *  - Return canvas.toDataURL("image/jpeg", 0.9).split(",")[1] (strip prefix)
 */

import { useState, useCallback } from "react";

/**
 * @param {React.RefObject<HTMLVideoElement>} videoRef
 * @returns {{ captureFrame: () => Promise<string>, isCapturing: boolean }}
 */
export default function useCaptureFrame(videoRef) {
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
