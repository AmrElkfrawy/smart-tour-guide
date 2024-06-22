const express = require('express');

const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
<<<<<<< HEAD
        reviewController.setSubjectUserIds,
=======
        reviewController.setSubjectAndUserIDs,
        reviewController.checkReviewPermission,
>>>>>>> feature/rent-tour-guide
        reviewController.createReview
    );

router
    .route('/:id')
    .get(reviewController.getReview)
    .delete(reviewController.checkIfAuth, reviewController.deleteReview)
    .patch(
        authController.restrictTo('user'),
        reviewController.checkIfAuth,
        reviewController.updateReview
    );

module.exports = router;
