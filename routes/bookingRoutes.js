const express = require('express');
const bookingController = require('../controllers/bookingController');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
    '/create',
    bookingController.createBooking,
    tourController.getAllTours
);

router.post(
    '/cart-checkout-session/:cartId',
    authController.protect,
    bookingController.createCartBookingCheckout
);

router.post(
    '/tour-checkout-session/:tourId',
    authController.protect,
    bookingController.createTourBookingCheckout
);

router.use(authController.protect);
router.route('/:id').get(bookingController.getBooking);
router
    .route('/')
    .get(bookingController.filterBookings, bookingController.getAllBookings);

router.use(authController.restrictTo('admin'));
router
    .route('/:id')
    .delete(bookingController.deleteBooking)
    .patch(bookingController.updateBooking);

module.exports = router;
