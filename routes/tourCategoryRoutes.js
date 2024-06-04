const express = require('express');
const tourCategoryController = require('../controllers/tourCategoryController');
const tourRouter = require('./tourRoutes');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').get(tourCategoryController.getAllTourCategories);
router.route('/:id').get(tourCategoryController.getTourCategory);

// router.use(authController.protect, authController.restrictTo('admin'));
router
    .route('/')
    .post(
        authController.protect,
        authController.restrictTo('admin'),
        tourCategoryController.createTourCategory
    );
router
    .route('/:id')
    .patch(
        authController.protect,
        authController.restrictTo('admin'),
        tourCategoryController.updateTourCategory
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin'),
        tourCategoryController.deleteTourCategory
    );

router.use('/:tourCategoryId/tours', tourRouter);
module.exports = router;
