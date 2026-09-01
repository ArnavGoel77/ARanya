const express = require('express');
const router = express.Router();

/**
 * @route POST /api/v1/users/:user_id/discoveries
 * @description Logs a successfully identified plant to the user's profile, calculates points, and evaluates badge unlocking logic.
 */
router.post('/:user_id/discoveries', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { plant_id, location } = req.body;
    
    // TODO: Implement logic to update user profile in Firestore
    
    // Mock response matching api-spec.md
    res.status(201).json({
      success: true,
      data: {
        points_awarded: 150,
        new_total_score: 650,
        is_new_discovery: true,
        badges_unlocked: [
          {
            badge_id: "badge_endemic_explorer",
            badge_name: "Endemic Explorer",
            icon_url: "https://storage.firebase.com/.../endemic_badge.png"
          }
        ],
        gamification_message: "Incredible discovery! You have documented a critically endangered species, earning a massive rarity point multiplier."
      }
    });
  } catch (error) {
    console.error('Error logging discovery:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
