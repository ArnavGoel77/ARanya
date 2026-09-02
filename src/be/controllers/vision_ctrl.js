const { db } = require('../config/firebase');
const tf = require('@tensorflow/tfjs'); // Switched to pure JS TF to avoid C++ build errors
const { Jimp } = require('jimp'); // Pure JS image decoding
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

let model;
let classes = [];

// Custom IO Handler to load Teachable Machine files from disk in pure JS
const customFileIO = (modelPath) => {
  return {
    load: async () => {
      const modelJsonData = fs.readFileSync(modelPath, 'utf8');
      const modelJson = JSON.parse(modelJsonData);
      
      const dir = path.dirname(modelPath);
      const weightManifest = modelJson.weightsManifest;
      const buffers = [];
      
      for (const group of weightManifest) {
        for (const pathStr of group.paths) {
          const weightPath = path.join(dir, pathStr);
          const buf = fs.readFileSync(weightPath);
          // Convert Node Buffer to ArrayBuffer
          buffers.push(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
        }
      }
      
      const totalLength = buffers.reduce((acc, b) => acc + b.byteLength, 0);
      const weightData = new Uint8Array(totalLength);
      let offset = 0;
      for (const b of buffers) {
        weightData.set(new Uint8Array(b), offset);
        offset += b.byteLength;
      }
      
      return {
        modelTopology: modelJson.modelTopology,
        weightSpecs: weightManifest[0].weights,
        weightData: weightData.buffer
      };
    }
  };
};

// Load the Teachable Machine model asynchronously
const loadModel = async () => {
  try {
    const modelPath = path.resolve(__dirname, '../model/model.json');
    const metadataPath = path.resolve(__dirname, '../model/metadata.json');

    if (fs.existsSync(modelPath) && fs.existsSync(metadataPath)) {
      model = await tf.loadLayersModel(customFileIO(modelPath));
      const metadata = require(metadataPath);
      classes = metadata.labels || [];
      console.log('Teachable Machine model and metadata loaded successfully.');
    } else {
      console.warn('[!] ML model files not found in src/be/model/ yet. Using mock inference mode.');
    }
  } catch (error) {
    console.warn('Could not load ML model ->', error.message);
  }
};

loadModel();

const identify_plant = async (req, res) => {
  try {
    // 1. Get the image buffer
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'No image_data provided in the upload.' });
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
    
    let identified_plant_id = null;
    let confidence_score = 0;

    // 2. Pre-process the image and run inference
    if (model && classes.length > 0) {
      // Decode image buffer using Jimp (Pure JS)
      const image = await Jimp.read(req.file.buffer);
      // Teachable Machine typically uses 224x224
      image.cover({ w: 224, h: 224 });
      
      const numPixels = image.bitmap.width * image.bitmap.height;
      const values = new Float32Array(numPixels * 3);

      for (let i = 0; i < numPixels; i++) {
        const rgba = image.bitmap.data.slice(i * 4, i * 4 + 4);
        // Normalize pixel values to [-1, 1] for TM models
        values[i * 3] = (rgba[0] / 127.5) - 1;     // R
        values[i * 3 + 1] = (rgba[1] / 127.5) - 1; // G
        values[i * 3 + 2] = (rgba[2] / 127.5) - 1; // B
      }

      const tensor = tf.tensor3d(values, [224, 224, 3], 'float32');
      const expanded = tensor.expandDims(0);

      const predictions = await model.predict(expanded).data();
      
      tf.dispose([tensor, expanded]);

      // Find the class with highest confidence
      let maxIndex = 0;
      for(let i = 0; i < predictions.length; i++) {
        if (predictions[i] > predictions[maxIndex]) {
          maxIndex = i;
        }
      }
      
      identified_plant_id = classes[maxIndex];
      confidence_score = predictions[maxIndex];
    } else {
      // Fallback Mock Logic if model isn't uploaded yet
      identified_plant_id = "plant_cg_101"; // Gibson's Croton
      confidence_score = 0.96;
    }

    // 3. Query Firestore for the identified plant metadata
    if (!db) {
       return res.status(500).json({ success: false, error: "Database not initialized" });
    }
    
    const docRef = db.collection('plants').doc(identified_plant_id);
    const docSnap = await docRef.get();
    
    let is_native_to_region = false;
    let requires_rare_highlight = false;

    if (docSnap.exists) {
       const plantData = docSnap.data();
       requires_rare_highlight = plantData.is_rare || false;
       
       // Geospatial mock check
       if (capture_location && capture_location.latitude) {
         is_native_to_region = true; 
       }
    } else {
       return res.status(404).json({ success: false, error: `Identified plant (${identified_plant_id}) not found in the database.` });
    }

    // 4. Return the formatted response matching api-spec.md
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
    console.error('Error identifying plant:', error);
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
