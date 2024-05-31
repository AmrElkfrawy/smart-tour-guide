const express = require('express');
const landmarkController = require('./../controllers/landmarkController');
const authController = require('../controllers/authController');

const reviewRouter = require('./reviewRoutes');

const router = express.Router();

router
    .route('/')
    .get(
        landmarkController.setCategoryIdToParams,
        landmarkController.getAllLandmarks
    )
    .post(
        authController.protect,
        authController.restrictTo('admin'),
        landmarkController.uploadLandmarkPhoto,
        landmarkController.resizeLandmarkPhoto,
        landmarkController.setCategoryIdToBody,
        landmarkController.createLandmark
    );
router.get('/most-visited', landmarkController.getMostVisitedLandmarks);

router
    .route('/:id')
    .get(landmarkController.getLandmark)
    .patch(
        authController.protect,
        authController.restrictTo('admin'),
        landmarkController.uploadLandmarkPhoto,
        landmarkController.resizeLandmarkPhoto,
        landmarkController.updateLandmark
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin'),
        landmarkController.deleteLandmark
    );

router.use('/:landmarkId/reviews', reviewRouter);

module.exports = router;
