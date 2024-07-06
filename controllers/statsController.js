const User = require('../models/userModel');
const Reviews = require('../models/reviewModel');
const Landmark = require('../models/landmarkModel');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
let redisClient;
if (process.env.redis === 'true') {
    redisClient = require('../utils/redisUtil');
}
const CustomizedTour = require('../models/customizedTourModel');

exports.getStats = catchAsync(async (req, res, next) => {
    let users, guides, reviews, landmarks, tours, bookings;
    if (process.env.redis === 'true') {
        const stats = await redisClient.exists('stats');

        if (stats) {
            users,
                guides,
                reviews,
                landmarks,
                tours,
                (bookings = JSON.parse(await redisClient.get('stats')));
        }
    } else {
        users = await User.countDocuments({ role: 'user' });
        guides = await User.countDocuments({ role: 'guide' });
        reviews = await Reviews.countDocuments();
        landmarks = await Landmark.countDocuments();
        bookings = await Booking.countDocuments();
        tours = await Tour.countDocuments();
        if (process.env.redis === 'true') {
            redisClient.SETEX(
                'stats',
                60 * 60 * 24,
                JSON.stringify({
                    users,
                    guides,
                    reviews,
                    landmarks,
                    tours,
                    bookings,
                })
            );
        }
    }
    return res.status(200).json({
        status: 'success',
        docs: {
            users,
            guides,
            reviews,
            landmarks,
            tours,
            bookings,
        },
    });
});

exports.getAdminStats = catchAsync(async (req, res, next) => {
    // Aggregations
    const monthlySignUps = await User.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(
                        new Date().setFullYear(new Date().getFullYear() - 1)
                    ),
                },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                },
                numUsers: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);

    const monthlyRevenue = await Booking.aggregate([
        {
            $group: {
                _id: {
                    $month: '$createdAt',
                },
                totalRevenue: { $sum: '$totalPrice' },
            },
        },
        {
            $project: {
                _id: 0, // Exclude the default _id field
                month: '$_id', // Rename _id to month
                totalRevenue: 1, // Include totalRevenue field
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);

    const revenueStats = await Booking.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$totalPrice' },
                averageRevenue: { $avg: '$totalPrice' },
            },
        },
    ]);

    const popularLandmarks = await CustomizedTour.aggregate([
        {
            $unwind: '$landmarks',
        },
        {
            $group: {
                _id: '$landmarks',
                numBookings: { $sum: 1 },
            },
        },
        {
            $sort: { numBookings: -1 },
        },
        {
            $lookup: {
                from: 'landmarks',
                localField: '_id',
                foreignField: '_id',
                as: 'landmark',
            },
        },
        {
            $unwind: '$landmark',
        },
        {
            $project: {
                name: '$landmark.name',
                numBookings: 1,
            },
        },
        {
            $limit: 5,
        },
    ]);

    const topGuides = await Booking.aggregate([
        { $unwind: '$tours' },
        {
            $group: {
                _id: '$tours.guide',
                bookingCount: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'guide',
            },
        },
        { $unwind: '$guide' },
        {
            $project: {
                _id: 0,
                name: '$guide.name',
                rating: '$guide.rating',
                ratingsQuantity: '$guide.ratingsQuantity',
                bookingCount: '$bookingCount',
            },
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 5 },
    ]);

    const topBookedTours = await Booking.aggregate([
        { $unwind: '$tours' },
        {
            $group: {
                _id: '$tours.tour',
                bookingCount: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: 'tours',
                localField: '_id',
                foreignField: '_id',
                as: 'tour',
            },
        },
        { $unwind: '$tour' },
        {
            $project: {
                _id: 0,
                name: '$tour.name',
                rating: '$tour.rating',
                ratingsQuantity: '$tour.ratingsQuantity',
                bookingCount: '$bookingCount',
            },
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 5 },
    ]);

    return res.status(200).json({
        status: 'success',
        docs: {
            monthlySignUps,
            monthlyRevenue,
            revenueStats,
            popularLandmarks,
            topGuides,
            topBookedTours,
        },
    });
});
