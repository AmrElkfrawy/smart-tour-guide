const User = require('../models/userModel');
const Reviews = require('../models/reviewModel');
const Landmark = require('../models/landmarkModel');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const redisClient = require('../utils/redisUtil');

exports.getStats = catchAsync(async (req, res, next) => {
    let users, guides, reviews, landmarks, tours, bookings;
    const stats = await redisClient.exists('stats');

    if (stats) {
        users,
            guides,
            reviews,
            landmarks,
            tours,
            (bookings = JSON.parse(await redisClient.get('stats')));
    } else {
        users = await User.countDocuments({ role: 'user' });
        guides = await User.countDocuments({ role: 'guide' });
        reviews = await Reviews.countDocuments();
        landmarks = await Landmark.countDocuments();
        bookings = await Booking.countDocuments();
        tours = await Tour.countDocuments();
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
