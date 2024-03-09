const Landmark = require('./../models/landmarkModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getAllLandmarks = catchAsync(async (req, res, next) => {
    // EXECUTE QUERY
    const features = new APIFeatures(Landmark.find(), req.query);
    const landmarks = await features.query;

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: landmarks.length,
        data: {
            landmarks,
        },
    });
});

exports.getLandmark = catchAsync(async (req, res, next) => {
    const landmark = await Landmark.findById(req.params.id);

    if (!landmark) {
        return next(new AppError('No landmark found with this ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            landmark,
        },
    });
});

exports.createLandmark = catchAsync(async (req, res, next) => {
    const newLandmark = await Landmark.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            landmark: newLandmark,
        },
    });
});

exports.updateLandmark = catchAsync(async (req, res, next) => {
    const landmark = await Landmark.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!landmark) {
        return next(new AppError('No landmark found with this ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            landmark,
        },
    });
});

exports.deleteLandmark = catchAsync(async (req, res, next) => {
    const landmark = await Landmark.findByIdAndDelete(req.params.id);

    if (!landmark) {
        return next(new AppError('No landmark found with this ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
