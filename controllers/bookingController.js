const Booking = require('../models/bookingModel');
const User = require('../models/normalUserModel');
const Tour = require('../models/tourModel');
const Cart = require('../models/cartModel');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.filterBookings = (req, res, next) => {
    if (req.user.role === 'user') {
        req.query.user = req.user.id;
    }
    if (req.user.role === 'guide') {
        req.query.guide = req.user.id;
    }
    next();
};

exports.getAllBookings = factory.getAll(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.updateBooking = factory.updateOne(Booking);

exports.getBooking = catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.user.role === 'user') filter = { user: req.user._id };
    if (req.user.role === 'guide') filter = { guide: req.user._id };
    const booking = await Booking.findOne({ _id: req.params.id, ...filter });
    if (req.user.role === 'user' && !booking)
        return next(new AppError("You don't have a booking with this id", 404));
    if (req.user.role === 'admin' && !booking)
        return next(new AppError('There is no booking with this id', 404));

    res.status(200).json({
        status: 'success',
        booking,
    });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    const cart = await Cart.findOne({
        user: req.user.id,
        _id: req.params.cartId,
    });
    if (!cart) {
        return next(
            new AppError('No cart found with that ID for this user', 404)
        );
    }

    if (!req.body.firstName)
        return next(new AppError('First name is required', 400));
    if (!req.body.lastName)
        return next(new AppError('Last name is required', 400));
    if (!req.body.phone) return next(new AppError('Phone is required', 400));

    const items = cart.cartItems.map((item) => {
        if (item.groupSize > item.tour.maxGroupSize) {
            return next(new AppError('Group size is too large', 400));
        }
        return {
            price_data: {
                unit_amount: item.tour.price * 100,
                currency: 'usd',
                product_data: {
                    name: item.tour.name,
                },
            },
            quantity: item.groupSize,
        };
    });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get(
            'host'
        )}/api/v1/bookings/create/?cartId=${req.params.cartId}&userId=${
            req.user._id
        }&price=${cart.totalPrice}&
        firstName=${req.body.firstName}&lastName=${req.body.lastName}&phone=${
            req.body.phone
        }`,
        cancel_url: `${req.protocol}://${req.get('host')}/api/v1/tours`,
        customer_email: req.user.email,
        client_reference_id: req.params.cartId,
        line_items: items,
        mode: 'payment',
    });

    res.status(200).json({
        status: 'success',
        session,
    });
});

exports.createBooking = catchAsync(async (req, res, next) => {
    const { cartId, userId, price, firstName, lastName, phone } = req.query;
    if (!cartId || !userId || !price || !firstName || !lastName || !phone) {
        return next();
    }
    const cart = await Cart.findOne({ _id: cartId, user: userId });
    if (!cart) {
        return next(new AppError('No cart found with that ID', 404));
    }
    const tours = cart.cartItems.map((item) => {
        return {
            tour: item.tour,
            groupSize: item.groupSize,
            price: item.tour.price,
            tourDate: item.tourDate,
            tourType: item.tourType,
            guide: item.guide,
        };
    });
    await Booking.create({
        user: userId,
        totalPrice: price,
        firstName,
        lastName,
        phone,
        tours,
    });

    const updatePromises = await Promise.all(
        cart.cartItems.map(async (item) => {
            return await Tour.findByIdAndUpdate(
                item.tour._id,
                {
                    $inc: { bookings: item.groupSize },
                },
                { new: true }
            );
        })
    );
    await Cart.findByIdAndDelete(cartId);
    const newUrl = `${req.protocol}://${req.get('host')}/api/v1/bookings`;
    res.redirect(newUrl);
});
