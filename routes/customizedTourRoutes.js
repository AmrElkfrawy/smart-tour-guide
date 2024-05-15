const express = require('express');
const customizedTourController = require('./../controllers/customizedTourController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get(
    '/my-requests',
    authController.restrictTo('user'),
    customizedTourController.getMyTourRequests
);
router.get(
    '/my-requests/filter',
    authController.restrictTo('user'),
    customizedTourController.getMyTourRequestsByStatus
);

router.get(
    '/my-requests/:id',
    authController.restrictTo('user'),
    customizedTourController.getTourRequestById
);

router.patch('/:id/cancel', customizedTourController.cancelCustomizedTour);
router.get(
    '/canceled',
    authController.restrictTo('admin', 'user'),
    customizedTourController.getCancelledTourRequests
);

router.patch(
    '/respond/:tourId',
    authController.restrictTo('guide'),
    customizedTourController.respondToTourRequest
); // id: tour request id

// /customizedTour/123/respond/guide/456
router.patch(
    '/:tourId/respond/guide/:guideId',
    authController.restrictTo('user'),
    customizedTourController.respondToTourGuide
);

router
    .route('/')
    .get(
        // authController.restrictTo('admin', 'guide'),
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
        // authController.restrictTo('guide', 'admin'),
        customizedTourController.getCustomizedTourById
    )
    .patch(
        // authController.restrictTo('admin'),
        customizedTourController.updateCustomizedTour
    )
    .delete(
        authController.restrictTo('user', 'admin'),
        customizedTourController.deleteCustomizedTour
    );

module.exports = router;
