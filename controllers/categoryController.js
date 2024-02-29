const Category = require('./../models/categoryModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getAllCategories = catchAsync(async (req, res, next) => {
    // EXECUTE QUERY
    const features = new APIFeatures(Category.find(), req.query);
    const categories = await features.query;

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: categories.length,
        data: {
            categories,
        },
    });
});

exports.createCategory = catchAsync(async (req, res, next) => {
    const newCategory = await Category.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            category: newCategory,
        },
    });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!category) {
        return next(new AppError('No category found with this ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            category,
        },
    });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
        return next(new AppError('No category found with this ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
