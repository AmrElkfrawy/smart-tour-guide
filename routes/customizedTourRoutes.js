const express = require('express');
const customizedTourController = require('./../controllers/customizedTourController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

// Routes for tour requests
router.get(
    '/my-requests',
    authController.restrictTo('user'),
    customizedTourController.getMyTourRequests
);

router.get(
    '/my-requests/:id',
    authController.restrictTo('user'),
    customizedTourController.getMyTourRequestById
);

router.get(
    '/canceled',
    authController.restrictTo('admin', 'user'),
    customizedTourController.getCancelledTourRequests
);

// Route for cancelling tour request
router.patch(
    '/:id/cancel',
    authController.restrictTo('user', 'admin'),
    customizedTourController.cancelCustomizedTour
);

// Routes for responding to tour requests
router.patch(
    '/respond/:tourId',
    authController.restrictTo('guide'),
    customizedTourController.respondToTourRequest
);

router.patch(
    '/:tourId/respond/guide/:guideId',
    authController.restrictTo('user'),
    customizedTourController.respondToTourGuide
);

// Routes for CRUD operations on customized tours
router
    .route('/')
    .get(
        authController.restrictTo('admin', 'guide'),
        customizedTourController.getAllCustomizedTours
    )
    .post(
        authController.restrictTo('user'),
        customizedTourController.setUserIdToBody,
        customizedTourController.createCustomizedTour
    );

router
    .route('/:id')
    .get(
        authController.restrictTo('guide', 'admin'),
        customizedTourController.getCustomizedTourById
    )
    .patch(
        authController.restrictTo('admin'),
        customizedTourController.updateCustomizedTour
    )
    .delete(
        authController.restrictTo('admin'),
        customizedTourController.deleteCustomizedTour
    );

module.exports = router;
