const express = require('express');
const router = express.Router();
const multer = require('multer');
const vision_ctrl = require('../../controllers/vision_ctrl');

// Configure multer to use memory storage for the uploaded image
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/v1/vision/offline-payload
router.get('/offline-payload', vision_ctrl.generate_offline_payload);

// POST /api/v1/vision/identify
router.post('/identify', upload.single('image_data'), vision_ctrl.identify_plant);

// POST /api/v1/vision/populate
router.post('/populate', express.json(), vision_ctrl.populate_plant);

module.exports = router;
