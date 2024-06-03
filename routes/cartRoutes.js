const express = require('express');
const cartController = require('../controllers/cartController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect, authController.restrictTo('user'));
router
    .route('/')
    .get(cartController.getLoggedUserCart)
    .post(cartController.addTourToCart)
    .delete(cartController.clearCart);

router
    .route('/:itemId')
    .patch(cartController.updateCartItemGroupSize)
    .delete(cartController.removeSpecificCartItem);

module.exports = router;
