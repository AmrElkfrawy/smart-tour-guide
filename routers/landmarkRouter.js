const express = require('express');

const landmarkController = require('../controllers/landmarkController');

const router = express.Router();

router.route('/').get(landmarkController.test);

module.exports = router;
