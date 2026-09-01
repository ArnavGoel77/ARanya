const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const geofire = require('geofire-common');

const getDb = () => {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }
  return null;
};

/**
 * @route GET /api/v1/location/nearby-species
 * @description Returns a curated list of native and threatened plants historically documented within a specified radius using advanced Geohash querying.
 */
router.get('/nearby-species', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius_km = parseFloat(req.query.radius_km) || 5; // Default 5km radius

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'Valid lat and lng query parameters are required.' });
    }

    const db = getDb();
    
    // Fallback to mock data if Firebase isn't initialized yet
    if (!db) {
      console.warn("Firebase Admin not initialized. Returning mock nearby species.");
      return res.status(200).json({
        success: true,
        data: {
          search_radius_km: radius_km,
          ecological_zone: "Mock Zone (DB Offline)",
          nearby_species: [
            { plant_id: "plant_am_204", scientific_name: "Alphonsea madraspatana", common_name: "Madras Alphonsea", distance_estimate_km: 1.2 },
            { plant_id: "plant_gs_205", scientific_name: "Gloriosa superba", common_name: "Flame Lily", distance_estimate_km: 2.8 }
          ]
        }
      });
    }

    const center = [lat, lng];
    const radiusInM = radius_km * 1000;

    // 1. Calculate Geohash bounding boxes for the requested radius
    const bounds = geofire.geohashQueryBounds(center, radiusInM);
    const promises = [];

    // 2. Execute parallel Firestore queries for each bounding box
    for (const b of bounds) {
      const q = db.collection('plants')
        .orderBy('geohash')
        .startAt(b[0])
        .endAt(b[1]);

      promises.push(q.get());
    }

    const snapshots = await Promise.all(promises);
    const matchingDocs = [];

    // 3. Post-query filtering (filter out false positives outside the exact circular radius)
    for (const snap of snapshots) {
      for (const doc of snap.docs) {
        const plantData = doc.data();
        
        // We expect the plant document to have a location (GeoPoint) or lat/lng fields
        const plantLat = plantData.location ? plantData.location.latitude : plantData.lat;
        const plantLng = plantData.location ? plantData.location.longitude : plantData.lng;
        
        if (plantLat && plantLng) {
          const distanceInKm = geofire.distanceBetween([plantLat, plantLng], center);
          
          // Verify it falls exactly within the circular radius
          if (distanceInKm <= radius_km) {
            matchingDocs.push({
              plant_id: doc.id,
              scientific_name: plantData.scientific_name || "Unknown",
              common_name: plantData.common_name || "Unknown",
              distance_estimate_km: parseFloat(distanceInKm.toFixed(2)),
              conservation_status: plantData.conservation_status,
              is_rare: plantData.is_rare || false
            });
          }
        }
      }
    }

    // 4. Sorting results by distance
    matchingDocs.sort((a, b) => a.distance_estimate_km - b.distance_estimate_km);

    // Advanced Extra: Determine ecological zone based on coordinates
    // In a production system, this would query a GIS polygon map. We approximate it here.
    let ecological_zone = "Unknown Zone";
    if (lat >= 10 && lat <= 20 && lng >= 73 && lng <= 80) {
      ecological_zone = "Western/Eastern Ghats Transitional Zone";
    } else {
      ecological_zone = "Indian Subcontinent Ecoregion";
    }

    res.status(200).json({
      success: true,
      data: {
        search_radius_km: radius_km,
        ecological_zone: ecological_zone,
        nearby_species: matchingDocs
      }
    });

  } catch (error) {
    console.error('Error fetching nearby species:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
