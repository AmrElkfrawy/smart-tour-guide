const express = require('express');
const customizedTourController = require('./../controllers/customizedTourController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/governorates', customizedTourController.getAllGovernorates);
router.get(
    '/landmarks/:governorate',
    customizedTourController.getLandmarksByGovernorate
);

// Routes for tour completion
router.patch(
    '/:tourId/confirm-completion/guide',
    authController.restrictTo('guide'),
    customizedTourController.confirmCompletionGuide
);

router.patch(
    '/:tourId/confirm-completion/user',
    authController.restrictTo('user'),
    customizedTourController.confirmCompletionUser
);

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

router.get(
    '/:tourId/browse-guides',
    authController.restrictTo('user'),
    customizedTourController.findGuidesForTourRequest
);

router.patch(
    '/tour/:tourId/guide/:guideId/send-request',
    authController.restrictTo('user'),
    customizedTourController.sendRequestToGuide
);

router.patch(
    '/tour/:tourId/guide/:guideId/cancel-request',
    authController.restrictTo('user'),
    customizedTourController.cancelRequestToGuide
);

router.get(
    '/:tourId/responding-guides',
    authController.restrictTo('user'),
    customizedTourController.getRespondingGuidesForTour
);

router.get(
    '/accepted-tours',
    authController.restrictTo('guide'),
    customizedTourController.getAcceptedToursForGuide
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
