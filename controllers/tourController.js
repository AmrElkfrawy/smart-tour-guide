const factory = require('./handlerFactory');
const Tour = require('../models/tourModel');
const CustomizedTour = require('../models/customizedTourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');

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

exports.resizeTourPhotos = (req, res, next) => {
    try {
        if (!req.files) return next();
        if (!req.files.images) return next();

        let uploadsCompleted = 0;
        const totalUploads = req.files.images.length;

        function checkUploadsCompleted() {
            uploadsCompleted++;
            if (uploadsCompleted === totalUploads) {
                next();
            }
        }

        if (req.files.images) {
            req.body.images = [];
            req.body.imagesId = [];
            req.files.images.forEach((image) => {
                const cld_upload_stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'tours',
                        transformation: [
                            {
                                width: 600,
                                height: 600,
                                gravity: 'auto',
                                crop: 'fill',
                            },
                        ],
                    },
                    function (error, result) {
                        if (error) {
                            return next(new AppError(error, 500));
                        }
                        req.body.images.push(result.secure_url);
                        req.body.imagesId.push(result.public_id);
                        checkUploadsCompleted();
                    }
                );
                streamifier
                    .createReadStream(image.buffer)
                    .pipe(cld_upload_stream);
            });
        }
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

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
    let { imagesIndex, images, imagesId } = req.body;

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
        if (!['0', '1', '2', 0, 1, 2].includes(imagesIndex[i])) {
            imagesIndex[i] = i;
        }
        tour.images[parseInt(imagesIndex[i])] = images[i];
        tour.imagesId[parseInt(imagesIndex[i])] = imagesId[i];
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
        tour.imagesId[parseInt(imagesIndex[i])] = undefined;
    }
    tour.images = tour.images.filter((item) => item !== null);
    tour.imagesId = tour.imagesId.filter((item) => item !== null);

    if (tour.images.length === 1 && tour.images[0] === undefined) {
        tour.images = [];
    }
    if (tour.imagesId.length === 1 && tour.imagesId[0] === undefined) {
        tour.imagesId = [];
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
