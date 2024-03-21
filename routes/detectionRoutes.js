const express = require('express');
const detectionController = require('./../controllers/detectionController');
const authController = require('../controllers/authController');

const router = express.Router();

router
    .route('/')
    .post(
        authController.protect,
        detectionController.uploadLandmarkPhoto,
        detectionController.detect
    );

module.exports = router;
