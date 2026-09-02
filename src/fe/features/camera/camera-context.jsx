/**
 * camera-context.jsx
 *
 * React Context + Provider for the Camera / Vision feature.
 *
 * What it owns:
 *  - Renders <CameraScanner> and captures its onScanComplete results
 *  - Holds the latest scan result in state so any descendant can read it
 *  - Exposes clearScanResult() so the dashboard can reset after logging
 *
 * How the dashboard uses it:
 *  1. Wrap your page tree with <CameraProvider>
 *  2. Place <CameraView /> wherever you want the camera feed to appear
 *  3. Read the result with useCameraContext() and call logDiscovery() on it
 *
 * State (camelCase per .antigravityrules §4):
 *  - lastScanResult    : Object | null  — the `data` object from /vision/identify
 *  - isScannerVisible  : boolean        — controls whether the feed is mounted
 *
 * Integration contract with DashboardProvider:
 *  lastScanResult.identified_plant_id  →  plantId arg for logDiscovery()
 *  (captureLocation is read from the scan result in a real implementation;
 *   for now the dashboard can pass { latitude: 0, longitude: 0 } as a fallback)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import CameraScanner from "./camera-scanner.jsx";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CameraContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Wraps the camera feature. Place this above any component that needs to read
 * scan results or toggle the scanner.
 *
 * @param {{ children: React.ReactNode }} props
 */
export const CameraProvider = ({ children }) => {
  /** The `data` sub-object from the last successful /vision/identify response. */
  const [lastScanResult, setLastScanResult] = useState(null);

  /** Controls whether CameraScanner (and WebRTC stream) is mounted. */
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  /** Called by CameraScanner every time a scan completes. */
  const handleScanComplete = useCallback((resultData) => {
    setLastScanResult(resultData);
  }, []);

  /** Reset after the dashboard has logged the discovery. */
  const clearScanResult = useCallback(() => {
    setLastScanResult(null);
  }, []);

  /** Show the camera feed. */
  const openScanner = useCallback(() => {
    setIsScannerVisible(true);
  }, []);

  /** Hide the camera feed and stop WebRTC (unmounting CameraScanner stops the stream). */
  const closeScanner = useCallback(() => {
    setIsScannerVisible(false);
  }, []);

  const contextValue = {
    lastScanResult,
    isScannerVisible,
    clearScanResult,
    openScanner,
    closeScanner,
  };

  return (
    <CameraContext.Provider value={contextValue}>
      {children}
      {/* CameraScanner is mounted here so it shares the provider's lifetime,
          but only rendered when the dashboard requests it. */}
      {isScannerVisible && (
        <CameraScanner onScanComplete={handleScanComplete} />
      )}
    </CameraContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Consume the CameraContext from any descendant of <CameraProvider>.
 *
 * @returns {{
 *   lastScanResult: {
 *     identified_plant_id: string,
 *     confidence_score: number,
 *     is_native_to_region: boolean,
 *     requires_rare_highlight: boolean
 *   } | null,
 *   isScannerVisible: boolean,
 *   clearScanResult: () => void,
 *   openScanner:     () => void,
 *   closeScanner:    () => void,
 * }}
 */
export const useCameraContext = () => {
  const ctx = useContext(CameraContext);
  if (!ctx) {
    throw new Error("useCameraContext must be used within a <CameraProvider>.");
  }
  return ctx;
};
