const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.checkIfAuth = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);
    // console.log(review);
    if (!review) {
        return next(new AppError('No review found with that id', 404));
    }

    if (req.user.role !== 'admin' && req.user.id !== review.user.id) {
        return next(new AppError('You can only edit your reviews', 401));
    }
    next();
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
    const reviews = await Review.find();
    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews,
        },
    });
});

exports.createReview = catchAsync(async (req, res, next) => {
    const newReview = await Review.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            review: newReview,
        },
    });
});

exports.getReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);
    if (!review) {
        return next(new AppError('No review found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            review,
        },
    });
});

exports.updateReview = catchAsync(async (req, res, next) => {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    if (!review) {
        return next(new AppError('No review found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            review,
        },
    });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
        return next(new AppError('No review found with that ID', 404));
    }
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
