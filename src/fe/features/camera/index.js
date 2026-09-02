/**
 * index.js — Camera feature public API
 *
 * This is the ONLY import path the dashboard (or any other feature) should use.
 * Internal implementation files (use-camera-stream, use-capture-frame, etc.)
 * are private to this feature directory.
 *
 * Dashboard usage:
 * ─────────────────────────────────────────────────────────────────────────────
 * import { CameraProvider, useCameraContext } from "../camera";
 *
 * // 1. Wrap your provider tree (above DashboardPage, or at the app root):
 * <CameraProvider>
 *   <DashboardProvider>
 *     <DashboardPage />
 *   </DashboardProvider>
 * </CameraProvider>
 *
 * // 2. Inside DashboardPage (or any child), consume the context:
 * const { lastScanResult, openScanner, closeScanner, clearScanResult } = useCameraContext();
 *
 * // 3. When a scan result arrives, log it and clear:
 * useEffect(() => {
 *   if (!lastScanResult) return;
 *   logDiscovery(lastScanResult.identified_plant_id, { latitude: 0, longitude: 0 });
 *   clearScanResult();
 * }, [lastScanResult]);
 * ─────────────────────────────────────────────────────────────────────────────
 */

export { CameraProvider, useCameraContext } from "./camera-context.jsx";
export { default as CameraScanner } from "./camera-scanner.jsx";
