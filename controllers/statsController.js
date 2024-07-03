const User = require('../models/userModel');
const Reviews = require('../models/reviewModel');
const Landmark = require('../models/landmarkModel');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getStats = catchAsync(async (req, res, next) => {
    const users = await User.countDocuments({ role: 'user' });
    const guides = await User.countDocuments({ role: 'guide' });
    const reviews = await Reviews.countDocuments();
    const landmarks = await Landmark.countDocuments();
    const bookings = await Booking.countDocuments();
    const tours = await Tour.countDocuments();
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
