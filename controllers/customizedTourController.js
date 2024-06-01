const CustomizedTour = require('../models/customizedTourModel');
const User = require('../models/userModel');

const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.setUserIdToBody = (req, res, next) => {
    req.body.user = req.user.id;
    next();
};

exports.getAllCustomizedTours = factory.getAll(CustomizedTour);
exports.getCustomizedTourById = factory.getOne(CustomizedTour);
exports.createCustomizedTour = factory.createOne(CustomizedTour);
exports.updateCustomizedTour = factory.updateOne(CustomizedTour);
exports.deleteCustomizedTour = factory.deleteOne(CustomizedTour);

exports.getMyTourRequests = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(
        CustomizedTour.find({ user: req.user.id }),
        req.query
    ).filter();

    const requests = await features.query;

    if (!requests) {
        return next(new AppError('No requests found', 404));
    }
    res.status(200).json({
        status: 'success',
        results: requests.length,
        data: {
            requests,
        },
    });
});

exports.getMyTourRequestById = catchAsync(async (req, res, next) => {
    const request = await CustomizedTour.findOne({
        user: req.user.id,
        _id: req.params.id,
    });
    if (!request) {
        return next(new AppError('No request found with this id', 400));
    }
    res.status(200).json({
        status: 'success',
        data: {
            request,
        },
    });
});

exports.cancelCustomizedTour = catchAsync(async (req, res, next) => {
    const customizedTour = await CustomizedTour.findById(req.params.id);

    if (!customizedTour) {
        return next(new AppError('Customized Tour not found', 404));
    }

    if (customizedTour.status === 'Cancelled') {
        return next(new AppError('Tour is already cancelled', 400));
    }

    if (customizedTour.user.id !== req.user.id) {
        return next(
            new AppError('You are not authorized to cancel this tour', 403)
        );
    }

    // Check if the tour can be cancelled based on its status and creation time
    const canCancelTour =
        customizedTour.status === 'Pending' ||
        (customizedTour.status === 'Confirmed' &&
            customizedTour.createdAt.getTime() >
                Date.now() - 24 * 60 * 60 * 1000);

    if (!canCancelTour) {
        return next(new AppError('Cannot cancel the tour at this time', 400));
    }

    customizedTour.status = 'Cancelled';
    await customizedTour.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        message: 'Tour request cancelled successfully',
        data: {
            customizedTour,
        },
    });
});

exports.getCancelledTourRequests = catchAsync(async (req, res, next) => {
    if (req.user.role === 'admin') {
        // Admins have access to all cancelled tour requests
        const cancelledTours = await CustomizedTour.find({
            status: 'cancelled',
        });
        return res.status(200).json({
            status: 'success',
            data: {
                cancelledTours,
            },
        });
    }

    if (req.user.role === 'user') {
        // Users have access to their own cancelled tour requests
        const cancelledTours = await CustomizedTour.find({
            user: req.user.id,
            status: 'cancelled',
        });
        return res.status(200).json({
            status: 'success',
            data: {
                cancelledTours,
            },
        });
    }

    // For tour guides or unauthorized users, return an error
    return next(
        new AppError(
            'You are not authorized to access cancelled tour requests',
            403
        )
    );
});

exports.respondToTourRequest = catchAsync(async (req, res, next) => {
    const tourRequest = await CustomizedTour.findById(req.params.tourId);

    if (!tourRequest) {
        return next(new AppError('Tour request not found. ', 404));
    }

    if (tourRequest.status !== 'pending' || tourRequest.acceptedGuide) {
        return next(new AppError('You can NOT respond to this tour', 400));
    }

    if (
        !tourRequest.respondingGuides.some((guideId) =>
            guideId.equals(req.user.id)
        )
    ) {
        console.log('hi');
        tourRequest.respondingGuides.push(req.user.id);
        await tourRequest.save();
    } else {
        return next(
            new AppError('You have already responded to this request.', 400)
        );
    }

    res.status(200).json({
        status: 'success',
        message: 'Tour guide response recorded successfully',
        data: {
            tourRequest,
        },
    });
});

exports.respondToTourGuide = catchAsync(async (req, res, next) => {
    const { tourId, guideId } = req.params;

    const tourRequest = await CustomizedTour.findOne({
        _id: tourId,
        user: req.user.id,
    });

    const { response } = req.body;

    if (!tourRequest || tourRequest.status === 'cancelled') {
        return next(new AppError('Tour request not found. ', 404));
    }

    if (tourRequest.status !== 'pending') {
        return next(new AppError('Tour Guide is already chosen.', 400));
    }

    if (!tourRequest.respondingGuides) {
        return next(
            new AppError('No guide has responded to this request. ', 400)
        );
    }

    if (!tourRequest.respondingGuides.some((Id) => Id.equals(guideId))) {
        return next(
            new AppError(
                'The specified guide has not responded to this request. ',
                400
            )
        );
    }

    if (response !== 'accept' && response !== 'reject') {
        return next(new AppError('Invalid response', 400));
    }

    if (response === 'accept') {
        tourRequest.acceptedGuide = guideId;
        tourRequest.status = 'confirmed';
        tourRequest.sentRequests = undefined;
    } else if (response === 'reject') {
        tourRequest.respondingGuides = tourRequest.respondingGuides.filter(
            (id) => !id.equals(guideId)
        );
    }

    await tourRequest.save();

    res.status(200).json({
        status: 'success',
        data: {
            tourRequest,
        },
    });
});

exports.findGuidesForTourRequest = catchAsync(async (req, res, next) => {
    const request = await CustomizedTour.findOne({
        _id: req.params.tourId,
        user: req.user.id,
        status: 'pending',
    });

    if (!request) {
        return next(new AppError('No request found with this id', 404));
    }

    const features = new APIFeatures(
        User.find({
            languages: { $all: request.spokenLanguages },
            cities: { $in: [request.city] },
        }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const availableGuides = await features.query;

    res.status(200).json({
        status: 'success',
        results: availableGuides.length,
        availableGuides,
    });
});

exports.sendRequestToGuide = catchAsync(async (req, res, next) => {
    const { tourId, guideId } = req.params;

    const tourRequest = await CustomizedTour.findOne({
        _id: tourId,
        user: req.user.id,
        status: 'pending',
    });

    if (!tourRequest) {
        return next(new AppError('No request found with this id', 404));
    }

    // Check if the guide is in the list of available guides
    const guide = await User.findOne({
        _id: guideId,
        languages: { $all: tourRequest.spokenLanguages },
        cities: { $in: [tourRequest.city] },
    });

    if (!guide) {
        return next(
            new AppError(
                'Guide not found or does not match the tour preferences',
                404
            )
        );
    }

    if (!tourRequest.sentRequests.includes(guideId)) {
        tourRequest.sentRequests.push(guideId);
        await tourRequest.save({ validateBeforeSave: false });
    }

    if (!guide.tourRequests.includes(tourId)) {
        guide.tourRequests.push(tourId);
        await guide.save({ validateBeforeSave: false });
    }

    // TODO: A notification must be sent to tour guide, Guide will accept or cancel

    res.status(200).json({
        status: 'success',
        message: 'Request sent.',
        tourRequest,
    });
});

exports.cancelRequestToGuide = catchAsync(async (req, res, next) => {
    const { tourId, guideId } = req.params;

    const tourRequest = await CustomizedTour.findOne({
        _id: tourId,
        user: req.user.id,
        status: 'pending',
    });

    if (!tourRequest) {
        return next(new AppError('No request found with this id', 404));
    }

    // Check if the guide is in the list of sent requests
    const index = tourRequest.sentRequests.indexOf(guideId);
    if (index > -1) {
        tourRequest.sentRequests.splice(index, 1);
        await tourRequest.save();
    } else {
        return next(new AppError('Guide not found in sent requests', 404));
    }

    // Remove request from guide's tour requests
    const guide = await User.findById(guideId);
    if (guide) {
        const guideIndex = guide.tourRequests.indexOf(tourId);
        if (guideIndex > -1) {
            guide.tourRequests.splice(guideIndex, 1);
            await guide.save();
        }
    }

    // TODO: A notification must be sent to the tour guide

    res.status(200).json({
        status: 'success',
        message: 'Request cancelled.',
    });
});
