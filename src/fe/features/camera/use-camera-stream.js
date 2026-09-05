/**
 * use-camera-stream.js
 *
 * Manages the full WebRTC camera stream lifecycle.
 *
 * Key design note — why we do NOT call videoRef.current.play() manually:
 *   Setting srcObject triggers a browser "load request". If play() is called
 *   immediately after, it races with that load and throws:
 *     "The play() request was interrupted by a new load request."
 *   Instead, the <video> element uses the `autoPlay` attribute (set in
 *   camera-scanner.jsx) and we listen for the native `playing` event to
 *   confirm frames are actually flowing before setting isStreaming = true.
 *
 * Returns:
 *  videoRef      – attach to <video autoPlay playsInline muted>
 *  isStreaming   – true once the `playing` event fires
 *  streamError   – Error | null
 *  startStream   – call to (re-)initialise the camera
 *  stopStream    – call to tear down tracks manually
 */

import { useRef, useState, useEffect, useCallback } from "react";

export default function useCameraStream() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isStoppedRef = useRef(false);
  const requestCountRef = useRef(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);

  const stopStream = useCallback(() => {
    isStoppedRef.current = true;
    requestCountRef.current += 1; // invalidate any pending requests
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
    isStoppedRef.current = false;
    const currentRequestId = ++requestCountRef.current;
    setStreamError(null);
    setIsStreaming(false);

    // Stop any existing stream first to avoid orphaned tracks (e.g., in React StrictMode)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      // If the user closed the camera, OR if a NEW stream request was started before this one finished:
      if (isStoppedRef.current || currentRequestId !== requestCountRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = mediaStream;

      const video = videoRef.current;
      if (!video) return;

      // Attach stream — do NOT call play() here.
      // autoPlay on the <video> element handles playback.
      video.srcObject = mediaStream;

      // Wait for the browser to confirm frames are flowing.
      await new Promise((resolve, reject) => {
        const onPlaying = () => {
          video.removeEventListener("playing", onPlaying);
          video.removeEventListener("error", onVideoError);
          resolve();
        };
        const onVideoError = (e) => {
          video.removeEventListener("playing", onPlaying);
          video.removeEventListener("error", onVideoError);
          reject(e);
        };
        video.addEventListener("playing", onPlaying);
        video.addEventListener("error", onVideoError);
      });

      setIsStreaming(true);
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
