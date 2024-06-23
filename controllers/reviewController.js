const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const CustomizedTour = require('../models/customizedTourModel');
const Booking = require('../models/bookingModel');

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

// Strategy functions
const checkBookedTour = async (userId, subject) => {
    const bookedTour = await Booking.findOne({ tour: subject, user: userId });
    if (!bookedTour) {
        throw new AppError('You can NOT review a tour you did not book.', 400);
    }
};

const checkBookedGuide = async (userId, subject) => {
    const customTour = await CustomizedTour.findOne({
        acceptedGuide: subject,
        user: userId,
    });
    if (!customTour) {
        throw new AppError(
            'You can NOT review a guide you did not book a tour with.',
            400
        );
    }
};

// Strategy map
const reviewCheckStrategies = {
    Tour: checkBookedTour,
    User: checkBookedGuide,
};

// Combined middleware function
exports.checkReviewPermission = catchAsync(async (req, res, next) => {
    const { reviewType, subject } = req.body;
    const userId = req.user.id;

    const checkStrategy = reviewCheckStrategies[reviewType];
    if (checkStrategy) {
        await checkStrategy(userId, subject);
    }

    next();
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
