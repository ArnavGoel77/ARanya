/**
 * mock-vision-api.js
 *
 * Simulates the two API endpoints owned by Frontend Developer 1:
 *   POST /api/v1/vision/identify
 *   GET  /api/v1/plants/:plant_id/ar-metadata
 *
 * Response shapes match the master contract in api-spec.md EXACTLY.
 * ─ snake_case: all response payload field names  (API domain)
 * ─ camelCase : all internal JS variables/params   (FE domain)
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulated network round-trip delay (ms). */
const MOCK_DELAY_MS = 800;

/**
 * Resolves after a configurable async delay to mimic real network latency.
 * @param {number} ms
 * @returns {Promise<void>}
 */
const simulateDelay = (ms = MOCK_DELAY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Fixture data — mirrors api-spec.md verbatim
// ---------------------------------------------------------------------------

/**
 * Fixture: POST /api/v1/vision/identify → 200 OK
 * @type {Object}
 */
const MOCK_IDENTIFY_RESPONSE = {
  success: true,
  data: {
    identified_plant_id: "plant_cg_101",
    confidence_score: 0.96,
    is_native_to_region: true,
    requires_rare_highlight: true,
  },
};

/**
 * Fixture map: GET /api/v1/plants/:plant_id/ar-metadata → 200 OK
 * Keyed by plant_id so additional plants can be added without changing call-sites.
 * @type {Record<string, Object>}
 */
const MOCK_AR_METADATA_DB = {
  plant_cg_101: {
    success: true,
    data: {
      plant_id: "plant_cg_101",
      scientific_name: "Croton gibsonianus",
      common_name: "Gibson's Croton",
      plant_family: "Euphorbiaceae",
      native_region: "Northern Western Ghats, Maharashtra",
      ecological_importance:
        "Crucial for supporting specific endemic insect populations in semi-evergreen forest riparian zones and maintaining stream bank stability.",
      conservation_status: "Critically Endangered",
      is_rare: true,
      threats:
        "Severe habitat loss and highly restricted localized populations near perennial streams.",
      conservation_best_practices:
        "Protect local perennial spring habitats. Support ex-situ conservation in specialized biosphere reserves.",
      historical_context:
        "Rediscovered after 180 years at Harishchandragad Hill.",
    },
  },
};

// ---------------------------------------------------------------------------
// Public mock functions
// ---------------------------------------------------------------------------

/**
 * Mocks POST /api/v1/vision/identify.
 *
 * Accepts FE-layer camelCase payload fields; in a real implementation this
 * function would serialize them to snake_case before sending over HTTP.
 *
 * @param {{
 *   imageData: string,
 *   captureLocation: { latitude: number, longitude: number },
 *   deviceTimestamp: string
 * }} payload
 * @returns {Promise<typeof MOCK_IDENTIFY_RESPONSE>}
 * @throws {Error} When required payload fields are missing.
 */
export async function mockIdentifyPlant(payload) {
  const { imageData, captureLocation, deviceTimestamp } = payload ?? {};

  if (!imageData) {
    throw new Error("mockIdentifyPlant: imageData is required.");
  }
  if (
    typeof captureLocation?.latitude !== "number" ||
    typeof captureLocation?.longitude !== "number"
  ) {
    throw new Error(
      "mockIdentifyPlant: captureLocation must contain numeric latitude and longitude."
    );
  }
  if (!deviceTimestamp) {
    throw new Error("mockIdentifyPlant: deviceTimestamp is required.");
  }

  await simulateDelay();
  // Return a deep clone so callers cannot mutate the fixture.
  return structuredClone(MOCK_IDENTIFY_RESPONSE);
}

/**
 * Mocks GET /api/v1/plants/:plant_id/ar-metadata.
 *
 * @param {string} plantId - e.g. "plant_cg_101"
 * @returns {Promise<typeof MOCK_AR_METADATA_DB[string]>}
 * @throws {Error} When plantId is missing or not found in the fixture DB.
 */
export async function mockGetArMetadata(plantId) {
  if (!plantId) {
    throw new Error("mockGetArMetadata: plantId is required.");
  }

  await simulateDelay();

  const record = MOCK_AR_METADATA_DB[plantId];
  if (!record) {
    throw new Error(
      `mockGetArMetadata: No fixture found for plant_id "${plantId}". ` +
        `Available IDs: ${Object.keys(MOCK_AR_METADATA_DB).join(", ")}`
    );
  }

  return structuredClone(record);
}
