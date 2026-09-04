const express = require('express');
const router = express.Router();
const { db } = require('../../config/firebase');

// GET /api/v1/plants/:plant_id/ar-metadata
router.get('/:plant_id/ar-metadata', async (req, res) => {
  try {
    const { plant_id } = req.params;
    
    // Fallback: intercept 'mock_human' to provide fake AR metadata
    if (plant_id === "mock_human") {
      return res.status(200).json({
        success: true,
        data: {
          plant_id: "mock_human",
          scientific_name: "Homo sapiens",
          common_name: "Human (Demo Data)",
          plant_family: "Hominidae",
          native_region: "Planet Earth",
          ecological_importance: "Top apex predator and dominant ecosystem engineer.",
          conservation_status: "Least Concern",
          is_rare: false,
          threats: "Climate change, habitat destruction, self-destructive behavior.",
          conservation_best_practices: "Reduce carbon footprint, protect biodiversity.",
          historical_context: "Evolved in Africa roughly 300,000 years ago."
        }
      });
    }

    if (!db) {
      return res.status(500).json({ success: false, error: "Database connection failed." });
    }

    const docRef = db.collection('plants').doc(plant_id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: "Plant metadata not found for the provided ID." });
    }

    const plantData = docSnap.data();

    // The data in Firestore is already perfectly formatted in snake_case per our schema
    res.status(200).json({
      success: true,
      data: plantData
    });
  } catch (error) {
    console.error('Error fetching plant metadata:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
