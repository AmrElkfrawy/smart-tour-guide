const express = require('express');
const detectionController = require('./../controllers/detectionController');

const router = express.Router();

router
    .route('/')
    .post(detectionController.uploadLandmarkPhoto, detectionController.detect);

module.exports = router;
