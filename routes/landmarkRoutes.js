const express = require('express');
const landmarkController = require('./../controllers/landmarkController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').get(landmarkController.getAllLandmarks).post(
    // authController.protect,
    // authController.restrictTo('admin'),
    landmarkController.createLandmark
);

router
    .route('/:id')
    .patch(
        authController.protect,
        authController.restrictTo('admin'),
        landmarkController.updateLandmark
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin'),
        landmarkController.deleteLandmark
    );

module.exports = router;
