const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Check if Firebase is initialized. We assume the main app.js handles the actual initialization
// with the Service Account credentials, but we grab the db instance here if available.
const getDb = () => {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }
  return null;
};

/**
 * @route POST /api/v1/users/:user_id/discoveries
 * @description Logs a successfully identified plant, calculates dynamic rarity points, global pioneer bonuses, and threshold badges.
 */
router.post('/:user_id/discoveries', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { plant_id, location } = req.body;
    
    const db = getDb();
    
    // Fallback to mock data if Firebase isn't initialized yet
    if (!db) {
      console.warn("Firebase Admin not initialized. Returning mock discovery response.");
      return res.status(201).json({
        success: true,
        data: {
          points_awarded: 500,
          new_total_score: 1150,
          is_new_discovery: true,
          badges_unlocked: [
            { badge_id: "badge_global_pioneer", badge_name: "Global Pioneer", icon_url: "https://storage.firebase.com/aranya/badges/pioneer.png" }
          ],
          gamification_message: "WORLD FIRST! You are the first person to ever document this species on ARanya."
        }
      });
    }

    const userRef = db.collection('users').doc(user_id);
    const discoveryRef = userRef.collection('discoveries').doc(plant_id);
    const plantRef = db.collection('plants').doc(plant_id);

    // Advanced Firestore transaction handling multiple documents simultaneously
    const result = await db.runTransaction(async (transaction) => {
      // 1. READS (Must come before any writes in a transaction)
      const userDoc = await transaction.get(userRef);
      const discoveryDoc = await transaction.get(discoveryRef);
      const plantDoc = await transaction.get(plantRef);

      // 2. Setup user state
      let current_score = 0;
      let existing_badges = [];
      let discoveries_count = 0;
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        current_score = userData.total_score || 0;
        existing_badges = userData.badges || [];
        discoveries_count = userData.discoveries_count || 0;
      } else {
        transaction.set(userRef, {
          total_score: 0,
          badges: [],
          discoveries_count: 0,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      const is_new_discovery = !discoveryDoc.exists;
      let points_awarded = 0;
      let badges_unlocked = [];
      let gamification_message = "You've already documented this plant, but keep exploring!";

      if (is_new_discovery) {
        let is_pioneer = false;
        let base_points = 100; // Base points for a common plant
        
        // 3. Dynamic Rarity Multipliers & Global Pioneer Bonus
        if (plantDoc.exists) {
          const plantData = plantDoc.data();
          
          // Dynamic scaling based on conservation status
          if (plantData.conservation_status === "Critically Endangered") {
            base_points = 500;
          } else if (plantData.conservation_status === "Endangered") {
            base_points = 300;
          } else if (plantData.is_rare) {
            base_points = 200;
          }

          // Global First Discovery check
          if (!plantData.first_discoverer_id) {
            is_pioneer = true;
            base_points += 1000; // Massive bonus for being the very first
            
            transaction.update(plantRef, {
              first_discoverer_id: user_id,
              first_discovered_at: admin.firestore.FieldValue.serverTimestamp()
            });
            
            badges_unlocked.push({
              badge_id: "badge_global_pioneer",
              badge_name: "Global Pioneer",
              icon_url: "https://storage.firebase.com/aranya/badges/pioneer_badge.png"
            });
          }
        }
        
        points_awarded = base_points;
        discoveries_count += 1;

        // 4. Threshold Milestones
        if (discoveries_count === 1 && !existing_badges.includes("badge_novice")) {
          badges_unlocked.push({ badge_id: "badge_novice", badge_name: "Novice Botanist", icon_url: "https://storage.firebase.com/aranya/badges/novice.png" });
        } else if (discoveries_count === 10 && !existing_badges.includes("badge_expert")) {
          badges_unlocked.push({ badge_id: "badge_expert", badge_name: "Expert Botanist", icon_url: "https://storage.firebase.com/aranya/badges/expert.png" });
        }

        if (is_pioneer) {
          gamification_message = "WORLD FIRST! You are the first person to ever document this species on ARanya. Massive pioneer bonus awarded!";
        } else if (points_awarded >= 300) {
          gamification_message = "Incredible discovery! You have documented a rare species, earning a massive rarity point multiplier.";
        } else {
          gamification_message = "Great find! A new species added to your collection.";
        }

        // 5. WRITES
        transaction.set(discoveryRef, {
          plant_id: plant_id,
          location: new admin.firestore.GeoPoint(location.latitude, location.longitude),
          discovered_at: admin.firestore.FieldValue.serverTimestamp(),
          points_earned: points_awarded
        });
        
        const new_badges_list = [...existing_badges, ...badges_unlocked.map(b => b.badge_id)];
        transaction.update(userRef, {
          total_score: current_score + points_awarded,
          discoveries_count: discoveries_count,
          badges: new_badges_list
        });
      }

      return {
        points_awarded,
        new_total_score: current_score + points_awarded,
        is_new_discovery,
        badges_unlocked,
        gamification_message
      };
    });

    res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error logging discovery:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route GET /api/v1/users/:user_id/discoveries
 * @description Fetches all plants discovered by a user for mapping.
 */
router.get('/:user_id/discoveries', async (req, res) => {
  try {
    const { user_id } = req.params;
    const db = getDb();
    if (!db) {
      return res.status(503).json({ success: false, error: "Database not initialized" });
    }

    const discoveriesSnap = await db.collection('users').doc(user_id).collection('discoveries').get();
    
    // We also need the plant names, so we fetch them too
    const discoveries = [];
    
    for (const docSnap of discoveriesSnap.docs) {
      const data = docSnap.data();
      const plantId = data.plant_id;
      
      let plantData = {};
      if (plantId === "mock_human") {
        plantData = {
          scientific_name: "Homo sapiens",
          common_name: "Human (Demo Data)",
          conservation_status: "Least Concern"
        };
      } else {
        const plantSnap = await db.collection('plants').doc(plantId).get();
        if (plantSnap.exists) {
          plantData = plantSnap.data();
        }
      }
      discoveries.push({
        plant_id: plantId,
        scientific_name: plantData.scientific_name || "Unknown",
        common_name: plantData.common_name || "Unknown",
        conservation_status: plantData.conservation_status || "Unknown",
        location: {
          latitude: data.location ? data.location.latitude : 0,
          longitude: data.location ? data.location.longitude : 0,
        },
        discovered_at: data.discovered_at ? data.discovered_at.toDate().toISOString() : new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      data: { discoveries }
    });
  } catch (error) {
    console.error('Error fetching discoveries:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
