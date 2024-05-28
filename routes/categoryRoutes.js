const express = require('express');
const categoryController = require('./../controllers/categoryController');
const authController = require('../controllers/authController');

const landmarkRouter = require('./landmarkRoutes');

const router = express.Router();

router
    .route('/')
    .get(categoryController.getAllCategories)
    .post(
        authController.protect,
        authController.restrictTo('admin'),
        categoryController.uploadCategoryPhoto,
        categoryController.resizeCategoryPhoto,
        categoryController.createCategory
    );

router
    .route('/:id')
    .get(categoryController.getCategory)
    .patch(
        authController.protect,
        authController.restrictTo('admin'),
        categoryController.uploadCategoryPhoto,
        categoryController.resizeCategoryPhoto,
        categoryController.updateCategory
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin'),
        categoryController.deleteCategory
    );

router.use('/:categoryId/landmarks', landmarkRouter);

module.exports = router;
