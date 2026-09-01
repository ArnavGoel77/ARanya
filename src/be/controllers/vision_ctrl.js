const express = require('express');

const identify_plant = async (req, res) => {
  try {
    const { image_data, capture_location, device_timestamp } = req.body;
    
    // Mock response based on api-spec.md
    res.status(200).json({
      success: true,
      data: {
        identified_plant_id: "plant_cg_101",
        confidence_score: 0.96,
        is_native_to_region: true,
        requires_rare_highlight: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  identify_plant
};
