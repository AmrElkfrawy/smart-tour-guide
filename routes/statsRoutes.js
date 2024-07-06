const express = require('express');
const statsController = require('../controllers/statsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').get(statsController.getStats);
router
    .route('/admin')
    .get(
        authController.protect,
        authController.restrictTo('admin'),
        statsController.getAdminStats
    );

module.exports = router;
