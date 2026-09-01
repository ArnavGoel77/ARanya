1. The API Contract (api-spec.md)
Markdown
# api-spec.md (Master API Contract)

## Domain 1: Vision and Identification Integration
Processes the captured camera frame via computer vision inference to identify the specific native plant species.

**Endpoint:** `POST /api/v1/vision/identify`

**Request Payload:**
```json
{
  "image_data": "base64_encoded_string_data...",
  "capture_location": {
    "latitude": 12.9165,
    "longitude": 79.1325
  },
  "device_timestamp": "2026-09-01T10:15:30Z"
}
Expected Response (200 OK):

JSON
{
  "success": true,
  "data": {
    "identified_plant_id": "plant_cg_101",
    "confidence_score": 0.96,
    "is_native_to_region": true,
    "requires_rare_highlight": true
  }
}
Domain 2: AR Metadata Retrieval
Fetches the scientific, ecological, and conservation-related information required for the Augmented Reality species visualization.

Endpoint: GET /api/v1/plants/:plant_id/ar-metadata

Expected Response (200 OK):

JSON
{
  "success": true,
  "data": {
    "plant_id": "plant_cg_101",
    "scientific_name": "Croton gibsonianus",
    "common_name": "Gibson's Croton",
    "plant_family": "Euphorbiaceae",
    "native_region": "Northern Western Ghats, Maharashtra",
    "ecological_importance": "Crucial for supporting specific endemic insect populations in semi-evergreen forest riparian zones and maintaining stream bank stability.",
    "conservation_status": "Critically Endangered",
    "is_rare": true,
    "threats": "Severe habitat loss and highly restricted localized populations near perennial streams.",
    "conservation_best_practices": "Protect local perennial spring habitats. Support ex-situ conservation in specialized biosphere reserves.",
    "historical_context": "Rediscovered after 180 years at Harishchandragad Hill."
  }
}
Domain 3: AI Botanical Guide (Virtual Assistant)
Processes natural language queries regarding the scanned plant, ecological importance, or local biodiversity.

Endpoint: POST /api/v1/chat/botanist

Request Payload:

JSON
{
  "user_id": "usr_99823",
  "current_plant_context": "plant_cg_101",
  "message": "Can I grow this plant in my home garden in Vellore?"
}
Expected Response (200 OK):

JSON
{
  "success": true,
  "data": {
    "reply_text": "Because Croton gibsonianus is highly habitat-specific to the perennial streams of the Western Ghats, it would be extremely difficult to cultivate in a standard home garden in Vellore. Instead, I recommend focusing on native Eastern Ghats species like Gloriosa superba for your local garden to support regional biodiversity.",
    "suggested_followup_queries": [
      "What are the best native plants for Vellore?",
      "How do specialized biosphere reserves work?"
    ]
  }
}
Domain 4: User Gamification and Discovery Profiles
Logs a successfully identified plant to the user's profile, calculates points, and evaluates badge unlocking logic.

Endpoint: POST /api/v1/users/:user_id/discoveries

Request Payload:

JSON
{
  "plant_id": "plant_cg_101",
  "location": {
    "latitude": 12.9165,
    "longitude": 79.1325
  }
}
Expected Response (201 Created):

JSON
{
  "success": true,
  "data": {
    "points_awarded": 150,
    "new_total_score": 650,
    "is_new_discovery": true,
    "badges_unlocked": [
      {
        "badge_id": "badge_endemic_explorer",
        "badge_name": "Endemic Explorer",
        "icon_url": "[https://storage.firebase.com/.../endemic_badge.png](https://storage.firebase.com/.../endemic_badge.png)"
      }
    ],
    "gamification_message": "Incredible discovery! You have documented a critically endangered species, earning a massive rarity point multiplier."
  }
}
Domain 5: Location-Based Biodiversity Insights
Returns a curated list of native and threatened plants historically documented within a specified radius of the user's current coordinates.

Endpoint: GET /api/v1/location/nearby-species

Expected Response (200 OK):

JSON
{
  "success": true,
  "data": {
    "search_radius_km": 5,
    "ecological_zone": "Eastern Ghats Foothills",
    "nearby_species": [
      {
        "plant_id": "plant_am_204",
        "scientific_name": "Alphonsea madraspatana",
        "common_name": "Madras Alphonsea",
        "distance_estimate_km": 1.2
      },
      {
        "plant_id": "plant_gs_205",
        "scientific_name": "Gloriosa superba",
        "common_name": "Flame Lily",
        "distance_estimate_km": 2.8
      }
    ]
  }
}