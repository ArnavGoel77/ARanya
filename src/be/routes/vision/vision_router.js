const express = require('express');
const router = express.Router();
const multer = require('multer');
const vision_ctrl = require('../../controllers/vision_ctrl');

// Configure multer to use memory storage for the uploaded image
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/v1/vision/identify
router.post('/identify', upload.single('image_data'), vision_ctrl.identify_plant);

module.exports = router;
