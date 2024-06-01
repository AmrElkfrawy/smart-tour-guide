const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect, authController.restrictTo('user'));
router
    .route('/')
    .get(wishlistController.getWishlist)
    .post(wishlistController.addToWishlist);

router.route('/:id').delete(wishlistController.removeFromWishlist);

module.exports = router;
