const { db } = require('../config/firebase');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const axios = require('axios');
const FormData = require('form-data');

const identify_plant = async (req, res) => {
  try {
    // 1. Check if image exists
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'No image_data provided in the upload.' });
    }

    if (!process.env.PLANTNET_API_KEY) {
      return res.status(500).json({ success: false, error: 'PLANTNET_API_KEY is not configured.' });
    }

    // Capture location comes as a string in multipart-form
    let capture_location = null;
    if (req.body.capture_location) {
      try {
        capture_location = JSON.parse(req.body.capture_location);
      } catch (e) {
        // Handle invalid JSON gracefully
      }
    }

    // 2. Prepare FormData for Pl@ntNet API
    const form = new FormData();
    form.append('images', req.file.buffer, {
      filename: req.file.originalname || 'image.jpg',
      contentType: req.file.mimetype || 'image/jpeg'
    });
    // Explicitly name the organ being identified
    form.append('organs', 'leaf');

    const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${process.env.PLANTNET_API_KEY}`;
    
    // 3. Call Pl@ntNet API
    const plantNetRes = await axios.post(url, form, { headers: form.getHeaders() });
    
    if (!plantNetRes.data || !plantNetRes.data.results || plantNetRes.data.results.length === 0) {
      // Fallback: send demo data for human if Pl@ntNet fails
      return res.status(200).json({
        success: true,
        data: {
          identified_plant_id: "mock_human",
          confidence_score: 0.99,
          is_native_to_region: true,
          requires_rare_highlight: false
        }
      });
    }

    const bestMatch = plantNetRes.data.results[0];
    const scientificName = bestMatch.species.scientificNameWithoutAuthor;
    const confidence_score = bestMatch.score;

    // 4. Query Firestore for the identified plant metadata using the scientific name
    if (!db) {
       return res.status(500).json({ success: false, error: "Database not initialized" });
    }
    
    const snapshot = await db.collection('plants').where('scientific_name', '==', scientificName).limit(1).get();
    
    let is_native_to_region = false;
    let requires_rare_highlight = false;
    let identified_plant_id = null;

    if (!snapshot.empty) {
       const docSnap = snapshot.docs[0];
       identified_plant_id = docSnap.id;
       const plantData = docSnap.data();
       requires_rare_highlight = plantData.is_rare || false;
       
       // Geospatial mock check
       if (capture_location && capture_location.latitude) {
         is_native_to_region = true; 
       }
    } else {
       // Fallback: send demo data for human if the identified plant is not in our database
       identified_plant_id = "mock_human";
       is_native_to_region = true;
       requires_rare_highlight = false;
    }

    // 5. Return the formatted response exactly matching the offline model structure
    res.status(200).json({
      success: true,
      data: {
        identified_plant_id,
        confidence_score: Number(confidence_score.toFixed(2)),
        is_native_to_region,
        requires_rare_highlight
      }
    });

  } catch (error) {
    if (error.response && error.response.status === 404) {
      // Fallback: send demo data for human instead of error
      return res.status(200).json({
        success: true,
        data: {
          identified_plant_id: "mock_human",
          confidence_score: 0.99,
          is_native_to_region: true,
          requires_rare_highlight: false
        }
      });
    }
    console.error('Error identifying plant via Pl@ntNet:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const generate_offline_payload = async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, error: "Database not initialized" });
    }

    // 1. Fetch all plant metadata from Firestore
    const plantsSnapshot = await db.collection('plants').get();
    const plantsData = [];
    plantsSnapshot.forEach(doc => {
      plantsData.push(doc.data());
    });

    // 2. Set headers to tell the browser/app it's downloading a zip file
    res.attachment('aranya_offline_payload.zip');
    
    // 3. Create a zip archiver stream
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    archive.on('error', (err) => {
      throw err;
    });

    // Pipe the dynamically generated archive directly to the HTTP response
    archive.pipe(res);

    // 4. Add the dynamically generated plants.json data
    archive.append(JSON.stringify(plantsData, null, 2), { name: 'plants.json' });

    // 5. Add the Teachable Machine model files from the filesystem
    const modelDir = path.resolve(__dirname, '../model');
    const filesToInclude = ['model.json', 'metadata.json', 'weights.bin'];
    
    for (const file of filesToInclude) {
      const filePath = path.join(modelDir, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      } else {
        console.warn(`[!] Offline Payload Warning: ${file} not found in src/be/model/`);
      }
    }

    // 6. Finalize the archive to finish the download
    await archive.finalize();

  } catch (error) {
    console.error('Error generating offline payload:', error);
    // Only send JSON error if the zip download hasn't started yet
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = {
  identify_plant,
  generate_offline_payload
};
