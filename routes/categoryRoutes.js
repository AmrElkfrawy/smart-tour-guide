const express = require('express');
const categoryController = require('./../controllers/categoryController');
const authController = require('../controllers/authController');

const router = express.Router();

router
    .route('/')
    .get(categoryController.getAllCategories)
    .post(
        authController.protect,
        authController.restrictTo('admin'),
        categoryController.createCategory
    );

router
    .route('/:id')
    .patch(
        authController.protect,
        authController.restrictTo('admin'),
        categoryController.updateCategory
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin'),
        categoryController.deleteCategory
    );

module.exports = router;
