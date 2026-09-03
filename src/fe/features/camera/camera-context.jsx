/**
 * camera-context.jsx
 *
 * React Context + Provider for the Camera / Vision feature.
 *
 * What it owns:
 *  - Renders <CameraScanner> via a React Portal directly on document.body.
 *    This means the camera overlay is NEVER affected by parent component
 *    unmounts (e.g., a Dashboard modal closing). Only explicit closeScanner()
 *    calls can hide it.
 *  - Holds the latest scan result in state so any descendant can read it.
 *  - Exposes clearScanResult() so the dashboard can reset after logging.
 *
 * How the dashboard uses it:
 *  1. Wrap your page tree with <CameraProvider>
 *  2. Call openScanner() to show the camera overlay
 *  3. Read the result with useCameraContext() and call logDiscovery() on it
 *  4. Call clearScanResult() after logging
 *  5. Call closeScanner() when done — this is the ONLY way to hide the camera
 *
 * State (camelCase per .antigravityrules §4):
 *  - lastScanResult   : Object | null
 *  - isScannerVisible : boolean
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { createPortal } from "react-dom";
import CameraScanner from "./camera-scanner.jsx";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CameraContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Wrap this above any component tree that needs camera access.
 * @param {{ children: React.ReactNode }} props
 */
export const CameraProvider = ({ children }) => {
  /** The `data` sub-object from the last successful /vision/identify response. */
  const [lastScanResult, setLastScanResult] = useState(null);

  /** Controls whether the camera overlay is mounted. */
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  const handleScanComplete = useCallback((resultData) => {
    setLastScanResult(resultData);
    // NOTE: do NOT call closeScanner() here.
    // The camera should stay open after identification.
    // The dashboard calls closeScanner() only when the user explicitly exits.
  }, []);

  const clearScanResult = useCallback(() => setLastScanResult(null), []);
  const openScanner    = useCallback(() => setIsScannerVisible(true), []);
  const closeScanner   = useCallback(() => setIsScannerVisible(false), []);

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

      {/*
        Portal renders the camera scanner directly onto document.body.
        This decouples it from the component tree — closing a Dashboard modal
        or any parent re-render cannot unmount it. Only closeScanner() can.
      */}
      {isScannerVisible &&
        createPortal(
          <CameraScanner onScanComplete={handleScanComplete} />,
          document.body
        )}
    </CameraContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Consume CameraContext from any descendant of <CameraProvider>.
 *
 * @returns {{
 *   lastScanResult: Object | null,
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
