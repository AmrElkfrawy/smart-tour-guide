const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post(
    '/checkout-session/:cartId',
    authController.protect,
    bookingController.createBookingCheckout
);

router.get('/create', bookingController.createBooking);

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
