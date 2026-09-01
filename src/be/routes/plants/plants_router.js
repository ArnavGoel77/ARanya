const express = require('express');
const router = express.Router();
const { db } = require('../../config/firebase');

// GET /api/v1/plants/:plant_id/ar-metadata
router.get('/:plant_id/ar-metadata', async (req, res) => {
  try {
    const { plant_id } = req.params;
    
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
