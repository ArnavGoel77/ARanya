import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Calculates the shortest angular difference between two angles in degrees.
 * Handles the 359→1 wrap-around so diff is always in [-180, 180].
 */
function shortestAngle(a, b) {
  let d = a - b;
  while (d > 180)  d -= 360;
  while (d < -180) d += 360;
  return d;
}

// ── Tuning constants ────────────────────────────────────────────────────────

/**
 * Low-pass filter strength (exponential smoothing factor).
 * Range: 0 (never moves) → 1 (no smoothing, raw signal).
 * 0.08 = strong smoothing, kills high-frequency sensor noise while
 * still responding clearly to intentional device movement (~0.5 s lag).
 */
const SMOOTHING_ALPHA = 0.08;

/**
 * Dead zone: angular changes smaller than this (degrees) are treated as
 * hardware noise and completely ignored — the chip won't move at all.
 */
const DEAD_ZONE_DEG = 0.4;

/** Pixel shift per degree of intentional device rotation (after dead zone). */
const PIXELS_PER_DEGREE = 18;

/** Maximum offset in any direction (px) — prevents chip leaving the screen. */
const MAX_OFFSET_PX = 120;

// ── Hook ────────────────────────────────────────────────────────────────────

export default function useArTracking(isActive) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Anchor: the device orientation at the moment a plant is identified.
  const anchorRef = useRef(null);

  // Smoothed (low-pass filtered) orientation values — updated in the rAF loop.
  const smoothedRef = useRef({ alpha: null, beta: null });

  // Raw sensor reading — written in the event handler, read in rAF.
  const rawRef = useRef({ alpha: null, beta: null });

  // rAF handle so we can cancel on unmount / deactivation.
  const rafRef = useRef(null);

  // ── Sensor event handler (runs at hardware rate, ~60 Hz) ─────────────────
  // Only updates a ref — no React state, no re-render.
  const handleOrientation = useCallback((event) => {
    const { alpha, beta } = event;
    if (alpha === null || beta === null) return;
    rawRef.current = { alpha, beta };
  }, []);

  // ── rAF loop (runs once per frame, ~60 fps) ──────────────────────────────
  // Reads raw sensor data, applies the low-pass filter, then schedules a
  // React state update only when the smoothed value has meaningfully changed.
  const startRafLoop = useCallback(() => {
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      const raw = rawRef.current;
      if (raw.alpha === null) return;

      const sm = smoothedRef.current;

      // Initialise smoothed values on first frame
      if (sm.alpha === null) {
        smoothedRef.current = { alpha: raw.alpha, beta: raw.beta };

        // Set anchor on first orientation reading
        if (!anchorRef.current) {
          anchorRef.current = { alpha: raw.alpha, beta: raw.beta };
        }
        return;
      }

      // Exponential low-pass filter applied to the angular difference
      // (we filter the delta, not the absolute angle, to handle wrap-around).
      const dAlpha = shortestAngle(raw.alpha, sm.alpha);
      const dBeta  = shortestAngle(raw.beta,  sm.beta);

      const newAlpha = sm.alpha + dAlpha * SMOOTHING_ALPHA;
      const newBeta  = sm.beta  + dBeta  * SMOOTHING_ALPHA;
      smoothedRef.current = { alpha: newAlpha, beta: newBeta };

      // Compute displacement from the anchor
      const diffAlpha = shortestAngle(newAlpha, anchorRef.current.alpha);
      const diffBeta  = shortestAngle(newBeta,  anchorRef.current.beta);

      // Apply dead zone — ignore sub-threshold movement (pure sensor noise)
      const xDeg = Math.abs(diffAlpha) < DEAD_ZONE_DEG ? 0 : diffAlpha;
      const yDeg = Math.abs(diffBeta)  < DEAD_ZONE_DEG ? 0 : diffBeta;

      // Convert to pixels and clamp to screen bounds
      const clamp = (v, max) => Math.max(-max, Math.min(max, v));
      const x = clamp(xDeg * PIXELS_PER_DEGREE, MAX_OFFSET_PX);
      const y = clamp(yDeg * PIXELS_PER_DEGREE, MAX_OFFSET_PX);

      setOffset(prev => {
        // Skip re-render if the change is sub-pixel (avoids thrashing React)
        if (Math.abs(prev.x - x) < 0.5 && Math.abs(prev.y - y) < 0.5) return prev;
        return { x, y };
      });
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopRafLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      // Reset everything when the result card is dismissed
      stopRafLoop();
      anchorRef.current   = null;
      smoothedRef.current = { alpha: null, beta: null };
      rawRef.current      = { alpha: null, beta: null };
      setOffset({ x: 0, y: 0 });
      return;
    }

    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    startRafLoop();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      stopRafLoop();
    };
  }, [isActive, handleOrientation, startRafLoop, stopRafLoop]);

  // ── iOS 13+ permission request ────────────────────────────────────────────
  const requestPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          console.warn('Device orientation permission denied.');
        }
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
      }
    }
  };

  return { offset, requestPermission };
}
