const express = require('express');
const statsController = require('../controllers/statsController');

const router = express.Router();

router.route('/').get(statsController.getStats);

module.exports = router;
