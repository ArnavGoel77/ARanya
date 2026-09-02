/**
 * use-camera-stream.js
 *
 * Manages the full WebRTC camera stream lifecycle:
 *  - Requests the rear-facing camera via navigator.mediaDevices.getUserMedia
 *  - Attaches the stream to a <video> ref
 *  - Cleans up all tracks on unmount or manual stop
 *
 * Returns:
 *  videoRef      – attach to <video> element as ref={videoRef}
 *  isStreaming   – true once the stream is active and playing
 *  streamError   – Error | null; set when getUserMedia or play() fails
 *  startStream   – call to (re-)initialise the camera
 *  stopStream    – call to tear down tracks manually
 */

import { useRef, useState, useEffect, useCallback } from "react";

export default function useCameraStream() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(async () => {
    setStreamError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      setStreamError(err);
      setIsStreaming(false);
    }
  }, []);

  // Auto-start on mount, auto-stop on unmount
  useEffect(() => {
    startStream();
    return () => stopStream();
  }, [startStream, stopStream]);

  return { videoRef, isStreaming, streamError, startStream, stopStream };
}
