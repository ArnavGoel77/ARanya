/**
 * mock-chat-api.js
 *
 * Local mock service replicating the ARanya API contract (api-spec.md).
 * Covers:
 *   - Domain 3: AI Botanical Guide  → POST /api/v1/chat/botanist
 *   - Domain 4: User Gamification   → POST /api/v1/users/:user_id/discoveries
 *
 * SERIALISATION RULES (per .antigravityrules):
 *   - Response payloads use strict snake_case to match the API contract.
 *   - Callers (React components) are responsible for mapping to camelCase state.
 *   - This file is pure logic — no Tailwind utilities or hex colors are used here.
 */

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Simulates realistic async network latency (600 – 1400 ms).
 * @returns {Promise<void>}
 */
const simulateNetworkDelay = () =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * 800) + 600)
  );

// ---------------------------------------------------------------------------
// Domain 3 — Static Data Bank
// ---------------------------------------------------------------------------

/**
 * Keyword-keyed reply bank. The first entry whose keywords match the user's
 * message wins. Falls back to DEFAULT_CHAT_REPLY when nothing matches.
 */
const CHAT_REPLY_BANK = [
  {
    keywords: ["grow", "garden", "cultivate", "home"],
    reply_text:
      "Because Croton gibsonianus is highly habitat-specific to the perennial streams of the Western Ghats, it would be extremely difficult to cultivate in a standard home garden in Vellore. Instead, I recommend focusing on native Eastern Ghats species like Gloriosa superba for your local garden to support regional biodiversity.",
    suggested_followup_queries: [
      "What are the best native plants for Vellore?",
      "How do specialized biosphere reserves work?",
    ],
  },
  {
    keywords: ["endangered", "threatened", "rare", "status"],
    reply_text:
      "Croton gibsonianus holds a 'Critically Endangered' classification under IUCN criteria. Its entire known range is confined to fewer than five micro-populations along perennial stream banks in the Northern Western Ghats. Habitat degradation and invasive species represent its primary extinction drivers.",
    suggested_followup_queries: [
      "What IUCN criteria classify a species as Critically Endangered?",
      "How can I report a rare plant sighting to conservation authorities?",
    ],
  },
  {
    keywords: ["ecology", "ecosystem", "insects", "role", "importance"],
    reply_text:
      "Gibson's Croton plays a keystone role in its riparian ecosystem by providing highly specific micro-habitat for endemic insect communities and stabilising eroding stream banks. Removing it would trigger a trophic cascade affecting specialist pollinators and several dependent plant species.",
    suggested_followup_queries: [
      "What is a trophic cascade?",
      "Which insects depend on this plant specifically?",
    ],
  },
  {
    keywords: ["history", "discovered", "found", "rediscovered"],
    reply_text:
      "Croton gibsonianus was first described in the 19th century and was subsequently considered lost to science for approximately 180 years before its dramatic rediscovery at Harishchandragad Hill in the Northern Western Ghats. This makes every documented sighting scientifically significant.",
    suggested_followup_queries: [
      "Are there other plants rediscovered after long periods?",
      "Who originally described Gibson's Croton?",
    ],
  },
  {
    keywords: ["threat", "danger", "deforestation", "loss"],
    reply_text:
      "The primary threats to Croton gibsonianus are severe habitat loss driven by land conversion, dam construction altering stream hydrology, and the highly restricted nature of its populations. Any single disturbance event could push it to functional extinction in the wild.",
    suggested_followup_queries: [
      "What conservation best practices protect riparian species?",
      "How does dam construction affect endemic flora?",
    ],
  },
];

/** Fallback reply used when no keyword bank entry matches. */
const DEFAULT_CHAT_REPLY = {
  reply_text:
    "That's a fascinating question about native biodiversity! Croton gibsonianus, like many endemic species of the Western Ghats, represents millions of years of evolutionary specialisation. I encourage you to explore the ARanya discovery map to find and document other rare species in your region.",
  suggested_followup_queries: [
    "How do I contribute my discoveries to citizen science databases?",
    "What other endemic plants exist in the Western Ghats?",
  ],
};

// ---------------------------------------------------------------------------
// Domain 4 — Static Data Bank
// ---------------------------------------------------------------------------

/**
 * Mock gamification state.
 * Starting score matches the api-spec.md example (500 base → 650 after +150).
 * Module-scoped so score accumulates across calls within the same browser session.
 */
let sessionTotalScore = 500;

/** Badge pool from which a random badge is awarded on each new discovery. */
const BADGE_POOL = [
  {
    badge_id: "badge_endemic_explorer",
    badge_name: "Endemic Explorer",
    icon_url: "https://storage.firebase.com/aranya-assets/badges/endemic_badge.png",
  },
  {
    badge_id: "badge_ghats_guardian",
    badge_name: "Ghats Guardian",
    icon_url: "https://storage.firebase.com/aranya-assets/badges/ghats_guardian.png",
  },
  {
    badge_id: "badge_riparian_ranger",
    badge_name: "Riparian Ranger",
    icon_url: "https://storage.firebase.com/aranya-assets/badges/riparian_ranger.png",
  },
];

/**
 * Tracks plant IDs already logged this session so revisit vs. new-discovery
 * logic mirrors real backend behaviour.
 */
const discoveredPlantIds = new Set();

// ---------------------------------------------------------------------------
// Domain 3: AI Botanical Guide  →  POST /api/v1/chat/botanist
// ---------------------------------------------------------------------------

/**
 * Sends a natural-language message to the mock AI Botanical Guide and returns
 * a response that exactly mirrors the api-spec.md Domain 3 contract.
 *
 * Request shape (mirrors api-spec.md):
 * ```json
 * {
 *   "user_id": "usr_99823",
 *   "current_plant_context": "plant_cg_101",
 *   "message": "Can I grow this plant in my home garden in Vellore?"
 * }
 * ```
 *
 * @param {Object} payload
 * @param {string} payload.user_id               - Authenticated user ID.
 * @param {string} payload.current_plant_context - Plant ID providing context.
 * @param {string} payload.message               - User's natural-language query.
 *
 * @returns {Promise<{
 *   success: boolean,
 *   data: {
 *     reply_text: string,
 *     suggested_followup_queries: string[]
 *   }
 * }>}
 *
 * @throws {Error} On missing required fields or a simulated (5%) server error.
 */
export const postBotanistMessage = async (payload) => {
  const { user_id, current_plant_context, message } = payload;

  // --- Input validation ---
  if (!user_id || !current_plant_context || !message?.trim()) {
    throw new Error(
      "MOCK_API_ERROR: user_id, current_plant_context, and message are all required."
    );
  }

  await simulateNetworkDelay();

  // Simulate a rare (5 %) server-side error for component resilience testing.
  if (Math.random() < 0.05) {
    throw new Error("MOCK_API_ERROR: Simulated 500 Internal Server Error.");
  }

  // --- Keyword-based reply selection ---
  const lowerMessage = message.toLowerCase();
  const matchedEntry = CHAT_REPLY_BANK.find((entry) =>
    entry.keywords.some((kw) => lowerMessage.includes(kw))
  );
  const replyData = matchedEntry ?? DEFAULT_CHAT_REPLY;

  // Return payload is snake_case to match the API contract exactly.
  return {
    success: true,
    data: {
      reply_text: replyData.reply_text,
      suggested_followup_queries: replyData.suggested_followup_queries,
    },
  };
};

// ---------------------------------------------------------------------------
// Domain 4: User Gamification  →  POST /api/v1/users/:user_id/discoveries
// ---------------------------------------------------------------------------

/**
 * Logs a plant discovery for the given user and returns gamification rewards,
 * exactly mirroring the api-spec.md Domain 4 contract (201 Created).
 *
 * Request shape (mirrors api-spec.md):
 * ```json
 * {
 *   "plant_id": "plant_cg_101",
 *   "location": { "latitude": 12.9165, "longitude": 79.1325 }
 * }
 * ```
 *
 * @param {string} userId  - Authenticated user ID (maps to :user_id URL param).
 * @param {Object} payload
 * @param {string} payload.plant_id              - ID of the discovered plant.
 * @param {Object} payload.location              - Geolocation of discovery.
 * @param {number} payload.location.latitude     - Latitude.
 * @param {number} payload.location.longitude    - Longitude.
 *
 * @returns {Promise<{
 *   success: boolean,
 *   data: {
 *     points_awarded: number,
 *     new_total_score: number,
 *     is_new_discovery: boolean,
 *     badges_unlocked: Array<{ badge_id: string, badge_name: string, icon_url: string }>,
 *     gamification_message: string
 *   }
 * }>}
 *
 * @throws {Error} On missing required fields.
 */
export const postDiscovery = async (userId, payload) => {
  const { plant_id, location } = payload;

  // --- Input validation ---
  if (!userId) {
    throw new Error("MOCK_API_ERROR: userId path parameter is required.");
  }
  if (!plant_id || location?.latitude == null || location?.longitude == null) {
    throw new Error(
      "MOCK_API_ERROR: plant_id and a valid location object { latitude, longitude } are required."
    );
  }

  await simulateNetworkDelay();

  // --- New-discovery vs. revisit logic ---
  const isNewDiscovery = !discoveredPlantIds.has(plant_id);

  // Points: 150 for first discovery (matches api-spec.md example), 30 for revisit.
  const pointsAwarded = isNewDiscovery ? 150 : 30;
  sessionTotalScore += pointsAwarded;

  // Badge unlock: one random badge awarded on every new unique discovery.
  let badgesUnlocked = [];
  if (isNewDiscovery) {
    discoveredPlantIds.add(plant_id);
    const randomBadge =
      BADGE_POOL[Math.floor(Math.random() * BADGE_POOL.length)];
    badgesUnlocked = [randomBadge];
  }

  const gamificationMessage = isNewDiscovery
    ? "Incredible discovery! You have documented a critically endangered species, earning a massive rarity point multiplier."
    : `Welcome back to this spot! You earned ${pointsAwarded} revisit bonus points. Keep exploring to find new species!`;

  // Return payload is snake_case to match the API contract exactly.
  return {
    success: true,
    data: {
      points_awarded: pointsAwarded,
      new_total_score: sessionTotalScore,
      is_new_discovery: isNewDiscovery,
      badges_unlocked: badgesUnlocked,
      gamification_message: gamificationMessage,
    },
  };
};
