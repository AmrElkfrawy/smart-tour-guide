const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
const factory = require('./handlerFactory');

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
exports.setSubjectUserIds = (req, res, next) => {
    // Allow nested routes
    if (!req.body.subject) req.body.subject = req.params.subjectId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
