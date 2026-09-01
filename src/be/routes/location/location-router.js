const express = require('express');
const router = express.Router();

/**
 * @route GET /api/v1/location/nearby-species
 * @description Returns a curated list of native and threatened plants historically documented within a specified radius of the user's current coordinates.
 */
router.get('/nearby-species', async (req, res) => {
  try {
    // TODO: Implement Firestore geospatial queries
    
    // Mock response matching api-spec.md
    res.status(200).json({
      success: true,
      data: {
        search_radius_km: 5,
        ecological_zone: "Eastern Ghats Foothills",
        nearby_species: [
          {
            plant_id: "plant_am_204",
            scientific_name: "Alphonsea madraspatana",
            common_name: "Madras Alphonsea",
            distance_estimate_km: 1.2
          },
          {
            plant_id: "plant_gs_205",
            scientific_name: "Gloriosa superba",
            common_name: "Flame Lily",
            distance_estimate_km: 2.8
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching nearby species:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
