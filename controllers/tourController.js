const factory = require('./handlerFactory');
const Tour = require('../models/tourModel');
const CustomizedTour = require('../models/customizedTourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(
            new AppError('Not an image! Please only upload images.', 400),
            false
        );
    }
};

const upload = multer({ storage: multerStorage, fileFilter: fileFilter });
exports.uploadTourImages = upload.fields([{ name: 'images', maxCount: 3 }]);
exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.images) return next();
    req.body.images = [];
    await Promise.all(
        req.files.images.map(async (file, i) => {
            const filename = `tour-${req.user.id}-${Date.now()}-${i + 1}.jpeg`;
            await sharp(file.buffer)
                .resize(500, 500)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`);
            req.body.images.push(filename);
        })
    );
    next();
});

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'guides' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.updateTourImages = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.tourId);
    const { imagesIndex, images } = req.body;
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }
    if (imagesIndex && imagesIndex.length !== images.length) {
        return next(new AppError('Please upload all images selected', 400));
    }

    for (let i = 0; i < imagesIndex.length; i++) {
        if (![0, 1, 2].includes(imagesIndex[i])) {
            imagesIndex[i] = i;
        }
        tour.images[imagesIndex[i]] = images[i];
    }
    await tour.save();
    res.status(200).json({
        status: 'success',
        data: {
            tour,
        },
    });
});

exports.deleteTourImages = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.tourId);
    const { imagesIndex } = req.body;
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    for (let i = 0; i < imagesIndex.length; i++) {
        if (![0, 1, 2].includes(imagesIndex[i])) {
            imagesIndex[i] = i;
        }
        tour.images[imagesIndex[i]] = undefined;
    }
    await tour.save();
    res.status(200).json({
        status: 'success',
        data: {
            tour,
        },
    });
});
