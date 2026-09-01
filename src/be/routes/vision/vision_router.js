const express = require('express');
const router = express.Router();
const vision_ctrl = require('../../controllers/vision_ctrl');

// POST /api/v1/vision/identify
router.post('/identify', vision_ctrl.identify_plant);

module.exports = router;
