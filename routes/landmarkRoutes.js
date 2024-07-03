const express = require('express');
const landmarkController = require('./../controllers/landmarkController');
const authController = require('../controllers/authController');

const reviewRouter = require('./reviewRoutes');

const router = express.Router({ mergeParams: true });

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
        landmarkController.resizeLandmarkPhotos,
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
        landmarkController.updateLandmark
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin'),
        landmarkController.deleteLandmark
    );
router
    .route('/:id/images')
    .patch(
        authController.protect,
        authController.restrictTo('admin'),
        landmarkController.uploadLandmarkPhoto,
        landmarkController.resizeLandmarkPhotos,
        landmarkController.updateLandmarkImages
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin'),
        landmarkController.deleteLandmarkImages
    );

router.get('/:id/recommendations', landmarkController.getRecommendations);

router.use('/:subjectId/reviews', reviewRouter);

module.exports = router;
