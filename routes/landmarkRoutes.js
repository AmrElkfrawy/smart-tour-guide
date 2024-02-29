const express = require('express');

const landmarkController = require('../controllers/landmarkController');
const authController = require('../controllers/authController');

const router = express.Router();

router
    .route('/')
    .get(authController.protect, landmarkController.test)
    .delete(
        authController.protect,
        authController.restrictTo('admin'),
        landmarkController.test
    );

module.exports = router;
