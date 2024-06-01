const express = require('express');
const tourCategoryController = require('../controllers/tourCategoryController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').get(tourCategoryController.getAllTourCategories);
router.route('/:id').get(tourCategoryController.getTourCategory);

router.use(authController.protect, authController.restrictTo('admin'));
router.route('/').post(tourCategoryController.createTourCategory);
router
    .route('/:id')
    .patch(tourCategoryController.updateTourCategory)
    .delete(tourCategoryController.deleteTourCategory);

module.exports = router;
