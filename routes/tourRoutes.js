const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router({ mergeParams: true });

router.post('/check-availability/:id', tourController.checkAvailability);

router
    .route('/')
    .get(tourController.setCategoryIdToParams, tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo('admin'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.createTour
    );

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin'),
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin'),
        tourController.deleteTour
    );

router
    .route('/:id/images')
    .patch(
        authController.protect,
        authController.restrictTo('admin'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTourImages
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin'),
        tourController.deleteTourImages
    );

router.use('/:subjectId/reviews', reviewRouter);

module.exports = router;
