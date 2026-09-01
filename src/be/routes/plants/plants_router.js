const express = require('express');
const router = express.Router();

// GET /api/v1/plants/:plant_id/ar-metadata
router.get('/:plant_id/ar-metadata', async (req, res) => {
  try {
    const { plant_id } = req.params;
    
    // Mock response for ar-metadata based on API spec
    res.status(200).json({
      success: true,
      data: {
        plant_id: plant_id,
        scientific_name: "Croton gibsonianus",
        common_name: "Gibson's Croton",
        plant_family: "Euphorbiaceae",
        native_region: "Northern Western Ghats, Maharashtra",
        ecological_importance: "Crucial for supporting specific endemic insect populations in semi-evergreen forest riparian zones and maintaining stream bank stability.",
        conservation_status: "Critically Endangered",
        is_rare: true,
        threats: "Severe habitat loss and highly restricted localized populations near perennial streams.",
        conservation_best_practices: "Protect local perennial spring habitats. Support ex-situ conservation in specialized biosphere reserves.",
        historical_context: "Rediscovered after 180 years at Harishchandragad Hill."
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
