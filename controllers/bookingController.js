const Booking = require('../models/bookingModel');
const User = require('../models/normalUserModel');
const Tour = require('../models/tourModel');
const Cart = require('../models/cartModel');
const CustomizedTour = require('../models/customizedTourModel');

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
    if (req.user.role === 'guide') filter = { tours: { guide: req.user._id } };
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

exports.createCartBookingCheckout = catchAsync(async (req, res, next) => {
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
                    images: [item.tour.images[0]],
                },
            },
            quantity: item.groupSize,
        };
    });

    // url based on environment
    let successUrl, cancelUrl;
    if (process.env.STRIPE_MODE === 'production') {
        successUrl = `https://${req.get(
            'host'
        )}/api/v1/bookings/redirect?status=success`;
        cancelUrl = `https://${req.get(
            'host'
        )}/api/v1/bookings/redirect?status=cancel`;
    } else {
        successUrl = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/bookings/create/?cartId=${req.params.cartId}&userId=${
            req.user._id
        }&price=${cart.totalCartPrice}&firstName=${
            req.body.firstName
        }&lastName=${req.body.lastName}&phone=${req.body.phone}&type=cart`;
        cancelUrl = `${req.protocol}://${req.get('host')}/api/v1/tours`;
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: req.user.email,
        client_reference_id: req.params.cartId,
        line_items: items,
        mode: 'payment',
        metadata: {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phone: req.body.phone,
            price: cart.totalCartPrice,
            type: 'cart',
            customer: req.user.id,
        },
    });

    res.status(200).json({
        status: 'success',
        session,
    });
});

exports.createTourBookingCheckout = catchAsync(async (req, res, next) => {
    const groupSize = req.body.groupSize || 1;
    const tour = await Tour.findById(req.params.tourId);
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    if (!req.body.firstName)
        return next(new AppError('First name is required', 400));
    if (!req.body.lastName)
        return next(new AppError('Last name is required', 400));
    if (!req.body.phone) return next(new AppError('Phone is required', 400));
    if (groupSize > tour.maxGroupSize) {
        return next(new AppError('Group size is too large', 400));
    }
    if (isNaN(Date.parse(req.body.tourDate))) {
        return next(new AppError('Please provide a valid date', 400));
    }
    const items = [
        {
            price_data: {
                unit_amount: tour.price * 100,
                currency: 'usd',
                product_data: {
                    name: tour.name,
                    images: [tour.images[0]],
                },
            },
            quantity: groupSize,
        },
    ];

    let successUrl, cancelUrl;
    if (process.env.STRIPE_MODE === 'production') {
        successUrl = `https://${req.get(
            'host'
        )}/api/v1/bookings/redirect?status=success`;
        cancelUrl = `https://${req.get(
            'host'
        )}/api/v1/bookings/redirect?status=cancel`;
    } else {
        successUrl = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/bookings/create/?tourId=${req.params.tourId}&userId=${
            req.user._id
        }&price=${tour.price}&groupSize=${req.body.groupSize}&tourDate=${
            req.body.tourDate
        }&firstName=${req.body.firstName}&lastName=${req.body.lastName}&phone=${
            req.body.phone
        }&type=standard`;
        cancelUrl = `${req.protocol}://${req.get('host')}/api/v1/tours`;
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: items,
        mode: 'payment',
        metadata: {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phone: req.body.phone,
            price: tour.price,
            groupSize: req.body.groupSize,
            tourDate: req.body.tourDate,
            type: 'standard',
            customer: req.user.id,
        },
    });

    res.status(200).json({
        status: 'success',
        session,
    });
});

exports.createCustomTourBookingCheckout = catchAsync(async (req, res, next) => {
    const customizedTour = await CustomizedTour.findById(
        req.params.customizedTourId
    );
    if (!customizedTour) {
        return next(new AppError('No tour found with that ID', 404));
    }
    if (customizedTour.status !== 'confirmed') {
        return next(new AppError('Customized tour is not confirmed yet', 400));
    }
    if (!req.body.firstName)
        return next(new AppError('First name is required', 400));
    if (!req.body.lastName)
        return next(new AppError('Last name is required', 400));
    if (!req.body.phone) return next(new AppError('Phone is required', 400));

    const items = [
        {
            price_data: {
                unit_amount: customizedTour.price * 100,
                currency: 'usd',
                product_data: {
                    name: 'Customized Tour',
                },
            },
            quantity: 1,
        },
    ];

    // url based on environment
    let successUrl, cancelUrl;
    if (process.env.STRIPE_MODE === 'production') {
        successUrl = `https://${req.get(
            'host'
        )}/api/v1/bookings/redirect?status=success`;
        cancelUrl = `https://${req.get(
            'host'
        )}/api/v1/bookings/redirect?status=cancel`;
    } else {
        successUrl = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/bookings/create/?customizedTourId=${
            req.params.customizedTourId
        }&firstName=${req.body.firstName}&lastName=${req.body.lastName}&phone=${
            req.body.phone
        }&type=custom`;
        cancelUrl = `${req.protocol}://${req.get('host')}/api/v1/tours`;
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: req.user.email,
        client_reference_id: req.params.customizedTourId,
        line_items: items,
        mode: 'payment',
        metadata: {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phone: req.body.phone,
            type: 'custom',
            customer: req.user.id,
        },
    });

    res.status(200).json({
        status: 'success',
        session,
    });
});

// this function is called after the payment is successful when working locally
exports.createBooking = catchAsync(async (req, res, next) => {
    if (req.query.type === 'standard') {
        const {
            tourId,
            userId,
            price,
            groupSize,
            firstName,
            lastName,
            phone,
            tourDate,
        } = req.query;
        if (
            !tourId ||
            !userId ||
            !price ||
            !groupSize ||
            !firstName ||
            !lastName ||
            !phone ||
            !tourDate
        ) {
            return next(new AppError('Invalid request', 400));
        }
        const tour = await Tour.findById(tourId);
        if (!tour) {
            return next(new AppError('No tour found with that ID', 404));
        }

        const guideId = tour.guide._id;

        await Booking.create({
            user: userId,
            totalPrice: price,
            firstName,
            lastName,
            phone,
            tourType: 'standard',
            tours: [
                {
                    tour: tourId,
                    groupSize,
                    price: price * groupSize,
                    tourDate,
                    guide: guideId,
                },
            ],
        });

        tour.bookings += groupSize;
        await tour.save();
        const newUrl = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/bookings/redirect?status=success`;
        res.redirect(newUrl);
    } else if (req.query.type === 'cart') {
        const { cartId, userId, price, firstName, lastName, phone } = req.query;
        if (!cartId || !userId || !price || !firstName || !lastName || !phone) {
            return next(new AppError('Invalid request', 400));
        }

        const cart = await Cart.findOne({ _id: cartId, user: userId });
        if (!cart) {
            return next(new AppError('No cart found with that ID', 404));
        }
        const tours = cart.cartItems.map((item) => {
            return {
                tour: item.tour,
                groupSize: item.groupSize,
                price: item.itemPrice,
                tourDate: item.tourDate,
                guide: item.tour.guide,
            };
        });
        await Booking.create({
            user: userId,
            totalPrice: price,
            tourType: 'standard',
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
        const newUrl = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/bookings/redirect?status=success`;
        res.redirect(newUrl);
    } else if (req.query.type === 'custom') {
        const { customizedTourId, firstName, lastName, phone } = req.query;
        if (!customizedTourId || !firstName || !lastName || !phone) {
            return next(new AppError('Invalid request', 400));
        }

        const customizedTour = await CustomizedTour.findById(customizedTourId);
        if (!customizedTour) {
            return next(
                new AppError('No customized tour found with that ID', 404)
            );
        }

        const guideId = customizedTour.acceptedGuide._id;
        await Booking.create({
            user: customizedTour.user._id,
            totalPrice: customizedTour.price,
            firstName,
            lastName,
            phone,
            tourType: 'customized',
            tours: [
                {
                    tour: customizedTourId,
                    groupSize: 1,
                    price: customizedTour.price,
                    tourDate: customizedTour.startDate,
                    guide: guideId,
                },
            ],
        });

        customizedTour.bookings += 1;
        customizedTour.paymentStatus = 'paid';
        await customizedTour.save();
        const newUrl = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/bookings/redirect?status=success`;
        res.redirect(newUrl);
    }
});

exports.webhookCheckout = (req, res, next) => {
    const signature = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed')
        createBookingCheckout(event.data.object);
    res.status(200).json({ received: true });
};

const createBookingCheckout = async (session) => {
    try {
        const type = session.metadata.type;
        if (type === 'standard') {
            const tour = await Tour.findById(session.client_reference_id);
            const guideId = tour.guide._id;
            await Booking.create({
                user: session.metadata.customer,
                firstName: session.metadata.firstName,
                totalPrice: session.metadata.price * session.metadata.groupSize,
                lastName: session.metadata.lastName,
                phone: session.metadata.phone,
                tourType: 'standard',
                tours: [
                    {
                        tour: session.client_reference_id,
                        groupSize: session.metadata.groupSize,
                        price: session.metadata.price,
                        tourDate: session.metadata.tourDate,
                        guide: guideId,
                    },
                ],
            });

            tour.bookings += session.metadata.groupSize;
            await tour.save();
        } else if (type === 'cart') {
            const cart = await Cart.findOne({
                _id: session.client_reference_id,
            });
            const tours = cart.cartItems.map((item) => {
                return {
                    tour: item.tour,
                    groupSize: item.groupSize,
                    price: item.itemPrice,
                    tourDate: item.tourDate,
                    guide: item.tour.guide,
                };
            });
            await Booking.create({
                user: session.metadata.customer,
                totalPrice: session.metadata.price,
                tourType: 'standard',
                firstName: session.metadata.firstName,
                lastName: session.metadata.lastName,
                phone: session.metadata.phone,
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
            await Cart.findByIdAndDelete(session.client_reference_id);
        } else if (type === 'custom') {
            const customizedTour = await CustomizedTour.findById(
                session.client_reference_id
            );
            const guideId = customizedTour.acceptedGuide._id;
            await Booking.create({
                user: customizedTour.user._id,
                totalPrice: customizedTour.price,
                firstName: session.metadata.firstName,
                lastName: session.metadata.lastName,
                phone: session.metadata.phone,
                tourType: 'customized',
                tours: [
                    {
                        tour: session.client_reference_id,
                        groupSize: 1,
                        price: customizedTour.price,
                        tourDate: customizedTour.startDate,
                        guide: guideId,
                    },
                ],
            });

            customizedTour.bookings += 1;
            customizedTour.paymentStatus = 'paid';
            await customizedTour.save();
        }
    } catch (err) {
        console.log(err);
    }
};

exports.redirectBooking = catchAsync(async (req, res, next) => {
    if (req.query.status === 'success') {
        res.render('paymentSuccess');
    } else {
        res.render('paymentFailure');
    }
});
