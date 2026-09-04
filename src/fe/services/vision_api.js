/**
 * vision_api.js
 *
 * Production vision service for Frontend Developer 1.
 * This module is the single integration point for all FE → Backend HTTP calls
 * within the camera and AR view domains.
 *
 * Endpoints wrapped:
 *   POST /api/v1/vision/identify
 *   GET  /api/v1/plants/:plant_id/ar-metadata
 *
 * During development, swap the internals for mock-vision-api.js calls.
 * In production, replace with real fetch / axios calls to the live backend.
 *
 * Naming contract (from .antigravityrules §4):
 *  - Request body fields sent over HTTP → snake_case  (API domain)
 *  - All internal JS variables / params  → camelCase  (FE domain)
 */

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "";

// ---------------------------------------------------------------------------
// identifyPlant  →  POST /api/v1/vision/identify
// ---------------------------------------------------------------------------

/**
 * Sends a captured camera frame to the vision endpoint for plant identification.
 *
 * @param {{
 *   imageData: string,
 *   captureLocation: { latitude: number, longitude: number },
 *   deviceTimestamp: string
 * }} params - camelCase FE params; serialized to snake_case for the HTTP body.
 * @returns {Promise<{
 *   success: boolean,
 *   data: {
 *     identified_plant_id: string,
 *     confidence_score: number,
 *     is_native_to_region: boolean,
 *     requires_rare_highlight: boolean
 *   }
 * }>}
 */
export async function identifyPlant({ imageData, captureLocation, deviceTimestamp }) {
  // Convert base64 image data back to binary blob for multipart upload
  const byteString = atob(imageData);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: "image/png" });

  const formData = new FormData();
  formData.append("image_data", blob, "capture.png");
  formData.append("capture_location", JSON.stringify({
    latitude: captureLocation.latitude,
    longitude: captureLocation.longitude,
  }));
  formData.append("device_timestamp", deviceTimestamp);

  const response = await fetch(`${API_BASE_URL}/api/v1/vision/identify`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error || `identifyPlant: HTTP ${response.status} — ${response.statusText}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// getArMetadata  →  GET /api/v1/plants/:plant_id/ar-metadata
// ---------------------------------------------------------------------------

/**
 * Retrieves the full AR metadata record for a given plant.
 *
 * @param {string} plantId - e.g. "plant_cg_101"
 * @returns {Promise<{
 *   success: boolean,
 *   data: {
 *     plant_id: string,
 *     scientific_name: string,
 *     common_name: string,
 *     plant_family: string,
 *     native_region: string,
 *     ecological_importance: string,
 *     conservation_status: string,
 *     is_rare: boolean,
 *     threats: string,
 *     conservation_best_practices: string,
 *     historical_context: string
 *   }
 * }>}
 */
export async function getArMetadata(plantId) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/plants/${encodeURIComponent(plantId)}/ar-metadata`
  );

  if (!response.ok) {
    throw new Error(`getArMetadata: HTTP ${response.status} — ${response.statusText}`);
  }

  return response.json();
}
