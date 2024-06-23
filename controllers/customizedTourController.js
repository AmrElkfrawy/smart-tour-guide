const CustomizedTour = require('../models/customizedTourModel');
const User = require('../models/userModel');

const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// Helper Functions

const findTourRequest = async (tourId, userId, status = null) => {
    const query = { _id: tourId, user: userId };
    if (status) {
        query.status = status;
    }
    return await CustomizedTour.findOne(query);
};

const findGuideResponse = (tourRequest, guideId) => {
    return tourRequest.respondingGuides.find((response) =>
        response.guide.equals(guideId)
    );
};

const updateTourRequestForAcceptance = catchAsync(
    async (tourRequest, guideId, guideResponse) => {
        tourRequest.acceptedGuide = guideId;
        tourRequest.price = guideResponse.price;
        tourRequest.status = 'confirmed';
        tourRequest.respondingGuides = undefined;
        // tourRequest.sentRequests = undefined;

        // Remove requests sent to other guides
        const otherGuides = await User.find({
            _id: {
                $in: tourRequest.sentRequests.filter(
                    (Id) => !Id.equals(guideId)
                ),
            },
        });

        for (const guide of otherGuides) {
            await removeRequestFromGuideRequests(guide, tourRequest._id);
        }
    }
);

const removeRequestFromGuideRequests = catchAsync(async (guide, tourId) => {
    guide.tourRequests = guide.tourRequests.filter(
        (requestId) => !requestId.equals(tourId)
    );
    await guide.save({ validateBeforeSave: false });
});

const handleRejectResponse = catchAsync(
    async (tourRequest, guideId, tourId) => {
        tourRequest.respondingGuides = tourRequest.respondingGuides.filter(
            (response) => !response.guide.equals(guideId)
        );

        // Remove the tour request from the guide's tour requests
        const guide = await User.findById(guideId);
        if (guide.tourRequests.find((Id) => Id.equals(tourId))) {
            await removeRequestFromGuideRequests(guide, tourId);
        }
    }
);

// Controller Functions

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
    const request = await findTourRequest(req.params.id, req.user.id);

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
    const customizedTour = await findTourRequest(req.params.id, req.user.id);

    if (!customizedTour) {
        return next(new AppError('Customized Tour not found', 404));
    }

    if (customizedTour.status === 'cancelled') {
        return next(new AppError('Tour is already cancelled', 400));
    }

    // Check if the tour can be cancelled based on its status and creation time
    const canCancelTour =
        customizedTour.status === 'pending' ||
        (customizedTour.status === 'confirmed' &&
            customizedTour.createdAt.getTime() >
                Date.now() - 24 * 60 * 60 * 1000);

    if (!canCancelTour) {
        return next(new AppError('Cannot cancel the tour at this time', 400));
    }

    customizedTour.status = 'cancelled';
    await customizedTour.save();

    res.status(200).json({
        status: 'success',
        message: 'Tour request cancelled successfully',
        data: {
            customizedTour,
        },
    });
});

// Get all cancelled tour requests based on user role
exports.getCancelledTourRequests = catchAsync(async (req, res, next) => {
    const filter = req.user.role === 'admin' ? {} : { user: req.user.id };
    const cancelledTours = await CustomizedTour.find({
        ...filter,
        status: 'cancelled',
    });

    if (!cancelledTours.length) {
        return next(new AppError('No cancelled tours found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { cancelledTours },
    });
});

exports.respondToTourRequest = catchAsync(async (req, res, next) => {
    const tourRequest = await CustomizedTour.findOne({
        _id: req.params.tourId,
        status: 'pending',
    });
    const guide = req.user;

    if (!tourRequest) {
        return next(new AppError('Tour request not found. ', 404));
    }

    // Check if the guide's languages and cities match the tour request
    const languagesMatch = tourRequest.spokenLanguages.every((lang) =>
        guide.languages.includes(lang)
    );
    const cityMatch = guide.cities.includes(tourRequest.city);

    if (!languagesMatch || !cityMatch) {
        return next(
            new AppError('You do NOT match this tour request preferences.', 400)
        );
    }

    if (tourRequest.acceptedGuide) {
        return next(new AppError('You can NOT respond to this tour.', 400));
    }

    const { price } = req.body;

    // Check if guide has already responded
    const guideResponse = findGuideResponse(tourRequest, req.user.id);

    if (guideResponse) {
        return next(
            new AppError('You have already responded to this request', 400)
        );
    }

    tourRequest.respondingGuides.push({ guide: req.user.id, price });
    await tourRequest.save();

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
    const { response } = req.body;

    const tourRequest = await findTourRequest(tourId, req.user.id, 'pending');

    if (!tourRequest) {
        return next(new AppError('Tour request not found.', 404));
    }

    if (!tourRequest.respondingGuides) {
        return next(
            new AppError('No guide has responded to this request yet.', 400)
        );
    }

    const guideResponse = findGuideResponse(tourRequest, guideId);

    if (!guideResponse) {
        return next(
            new AppError(
                'The specified guide has not responded to this request.',
                400
            )
        );
    }

    if (response !== 'accept' && response !== 'reject') {
        return next(new AppError('Invalid response', 400));
    }

    if (response === 'accept') {
        await updateTourRequestForAcceptance(
            tourRequest,
            guideId,
            guideResponse
        );
    } else if (response === 'reject') {
        await handleRejectResponse(tourRequest, guideId, tourId);
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
    const request = await findTourRequest(
        req.params.tourId,
        req.user.id,
        'pending'
    );

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

    const tourRequest = await findTourRequest(
        req.params.tourId,
        req.user.id,
        'pending'
    );

    if (!tourRequest) {
        return next(new AppError('No request found with this id', 404));
    }

    // Check if guide already received a request for this tour
    if (tourRequest.sentRequests.find((Id) => Id.equals(guideId))) {
        return next(new AppError('Guide has already been sent a request', 400));
    }

    if (findGuideResponse(tourRequest, guideId)) {
        return next(
            new AppError(
                'Guide has already responded to the request with price proposal.',
                400
            )
        );
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

    tourRequest.sentRequests.push(guideId);

    await tourRequest.save();

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

    const tourRequest = await findTourRequest(
        req.params.tourId,
        req.user.id,
        'pending'
    );

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
    removeRequestFromGuideRequests(guide, tourId);

    // TODO: A notification must be sent to the tour guide

    res.status(200).json({
        status: 'success',
        message: 'Request cancelled.',
    });
});
