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

exports.setCategoryIdToParams = (req, res, next) => {
    if (!req.params && !req.params.tourCategoryId)
        req.params.tourCategoryId = req.body.category;

    next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'guide reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.updateTourImages = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
        return next(new AppError('No tour found with this ID', 404));
    }
    let { imagesIndex, images } = req.body;

    if (!Array.isArray(imagesIndex)) {
        imagesIndex = [imagesIndex];
    }
    if (!imagesIndex || !images)
        return next(new AppError('Please provide images and imagesIndex', 400));
    if (imagesIndex.length > 3) {
        return next(new AppError('You can only upload 3 images', 400));
    }
    if (imagesIndex.length !== images.length) {
        return next(new AppError('Please upload all images selected', 400));
    }
    for (let i = 0; i < imagesIndex.length; i++) {
        if (!['0', '1', '2'].includes(imagesIndex[i])) {
            imagesIndex[i] = i;
        }
        tour.images[parseInt(imagesIndex[i])] = images[i];
    }
    await tour.save();
    res.status(200).json({
        status: 'success',
        doc: {
            tour,
        },
    });
});

exports.deleteTourImages = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
        return next(new AppError('No tour found with this ID', 404));
    }
    let imagesIndex = req.body.imagesIndex;

    if (imagesIndex === undefined)
        return next(
            new AppError('Please provide imagesIndexes to delete', 400)
        );

    if (!Array.isArray(imagesIndex)) {
        imagesIndex = [imagesIndex];
    }
    if (imagesIndex.length > 3) {
        return next(new AppError('You can only select 3 images', 400));
    }

    for (let i = 0; i < imagesIndex.length; i++) {
        if (!['0', '1', '2', 0, 1, 2].includes(imagesIndex[i])) {
            imagesIndex[i] = i;
        }
        tour.images[parseInt(imagesIndex[i])] = undefined;
    }
    tour.images = tour.images.filter((item) => item !== null);

    if (tour.images.length === 1 && tour.images[0] === undefined) {
        tour.images = [];
    }
    await tour.save();
    res.status(200).json({
        status: 'success',
        doc: {
            tour,
        },
    });
});

exports.checkAvailability = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
        return next(new AppError('No tour found with this ID', 404));
    }
    let { tourDate, groupSize } = req.body;
    if (!tourDate || !groupSize) {
        return next(
            new AppError('Please provide tourDate and groupSize to check', 400)
        );
    }

    if (isNaN(Date.parse(tourDate))) {
        return next(new AppError('Please provide a valid date', 400));
    }

    const available = tour.checkAvailability(tourDate, groupSize);
    res.status(200).json({
        status: 'success',
        available,
    });
});
