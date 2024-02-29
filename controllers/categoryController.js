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
