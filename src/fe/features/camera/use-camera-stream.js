/**
 * use-camera-stream.js
 *
 * Custom React hook — manages the WebRTC camera stream lifecycle.
 *
 * Returns:
 *  - videoRef     : React ref to attach to a <video> element
 *  - isStreaming  : boolean — true once the stream is active
 *  - streamError  : Error | null — set if getUserMedia fails
 *  - stopStream   : function — call on unmount / user cancel
 *
 * TODO (implementation phase):
 *  - Call navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
 *  - Attach stream to videoRef.current.srcObject
 *  - Clean up tracks on component unmount via useEffect return
 */

import { useRef, useState, useEffect } from "react";

/**
 * @returns {{
 *   videoRef: React.RefObject<HTMLVideoElement>,
 *   isStreaming: boolean,
 *   streamError: Error | null,
 *   stopStream: () => void
 * }}
 */
export default function useCameraStream() {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);

  function stopStream() {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      })
      .catch((err) => {
        if (mounted) setStreamError(err);
      });
      
    return () => {
      mounted = false;
      stopStream();
    };
  }, []);

  return { videoRef, isStreaming, streamError, stopStream };
}
