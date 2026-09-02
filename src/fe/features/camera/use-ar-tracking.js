import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Calculates the shortest angular difference between two angles in degrees.
 * E.g., transitioning from 359 to 1 should be a difference of 2, not -358.
 */
function getShortestAngle(target, current) {
  if (target === null || current === null) return 0;
  let diff = target - current;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}

// Approximate pixel shift per degree of device rotation.
// Adjust this for sensitivity.
const PIXELS_PER_DEGREE = 20;

export default function useArTracking(isActive) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const anchorRef = useRef(null);

  const handleOrientation = useCallback((event) => {
    const { alpha, beta, gamma } = event;
    if (alpha === null || beta === null) return;

    if (!anchorRef.current) {
      // Set the anchor on the first event after becoming active
      anchorRef.current = { alpha, beta, gamma };
      setOffset({ x: 0, y: 0 });
      return;
    }

    // Alpha is compass (pan left/right), Beta is tilt (up/down).
    // Note: This is a simplification and works best when the phone is held upright in portrait mode.
    const diffAlpha = getShortestAngle(alpha, anchorRef.current.alpha);
    const diffBeta = getShortestAngle(beta, anchorRef.current.beta);

    // If we tilt the phone UP (beta increases), the physical object moves DOWN in the camera frame.
    // So we want our AR card to move DOWN (positive Y).
    // If we pan the phone RIGHT (alpha decreases), the physical object moves LEFT in the frame.
    // So we want our AR card to move LEFT (negative X).
    // The exact signs depend on the device OS and standard, but this provides a strong starting point.
    setOffset({
      x: diffAlpha * PIXELS_PER_DEGREE,
      y: diffBeta * PIXELS_PER_DEGREE,
    });
  }, []);

  useEffect(() => {
    if (!isActive) {
      anchorRef.current = null;
      setOffset({ x: 0, y: 0 });
      return;
    }

    // Start listening to orientation when active
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isActive, handleOrientation]);

  // Expose an explicit permission request for iOS 13+ devices
  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          console.log('Device orientation permission granted.');
        } else {
          console.warn('Device orientation permission denied.');
        }
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
      }
    }
  };

  return { offset, requestPermission };
}
