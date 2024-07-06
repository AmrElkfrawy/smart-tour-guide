const Landmark = require('./../models/landmarkModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
let redisClient;
if (process.env.redis === 'true') {
    redisClient = require('./../utils/redisUtil');
}
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');

const fileStorage = multer.memoryStorage();

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

const upload = multer({ storage: fileStorage, fileFilter: fileFilter });
exports.uploadLandmarkPhoto = upload.fields([{ name: 'images', maxCount: 3 }]);

// exports.test = upload.array('images', 5);

exports.resizeLandmarkPhotos = (req, res, next) => {
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
                        folder: 'landmarks',
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
    if (!req.params && !req.params.categoryId)
        req.params.categoryId = req.body.category;

    next();
};

exports.setCategoryIdToBody = (req, res, next) => {
    if (!req.body.category) req.body.category = req.params.categoryId;
    next();
};

exports.getAllLandmarks = factory.getAll(Landmark);
exports.getLandmark = factory.getOne(Landmark, { path: 'reviews' });
exports.createLandmark = factory.createOne(Landmark);
exports.deleteLandmark = factory.deleteOne(Landmark);
exports.updateLandmark = factory.updateOne(Landmark);

exports.getMostVisitedLandmarks = catchAsync(async (req, res, next) => {
    const landmarks = await Landmark.find().sort({ visitsNumber: -1 }).limit(6);
    res.status(200).json({
        status: 'success',
        data: {
            landmarks,
        },
    });
});

exports.updateLandmarkImages = catchAsync(async (req, res, next) => {
    const landmark = await Landmark.findById(req.params.id);
    if (!landmark) {
        return next(new AppError('No landmark found with this ID', 404));
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
        landmark.images[parseInt(imagesIndex[i])] = images[i];
        landmark.imagesId[parseInt(imagesIndex[i])] = imagesId[i];
    }
    await landmark.save();
    if (process.env.redis === 'true') {
        redisClient.flushAll();
    }
    res.status(200).json({
        status: 'success',
        doc: {
            landmark,
        },
    });
});

exports.deleteLandmarkImages = catchAsync(async (req, res, next) => {
    const landmark = await Landmark.findById(req.params.id);
    if (!landmark) {
        return next(new AppError('No landmark found with this ID', 404));
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
        landmark.images[parseInt(imagesIndex[i])] = undefined;
        landmark.imagesId[parseInt(imagesIndex[i])] = undefined;
    }
    landmark.images = landmark.images.filter((item) => item !== null);
    landmark.imagesId = landmark.imagesId.filter((item) => item !== null);

    if (landmark.images.length === 1 && landmark.images[0] === undefined) {
        landmark.images = [];
    }
    if (landmark.imagesId.length === 1 && landmark.imagesId[0] === undefined) {
        landmark.imagesId = [];
    }
    await landmark.save();
    if (process.env.redis === 'true') {
        redisClient.flushAll();
    }
    res.status(200).json({
        status: 'success',
        doc: {
            landmark,
        },
    });
});

const Tour = require('./../models/tourModel');
// normall in lat, lng
exports.getRecommendations = catchAsync(async (req, res, next) => {
    const landmark = await Landmark.findById(req.params.id);
    if (!landmark) {
        return next(new AppError('No landmark found with this ID', 404));
    }
    const lat = landmark.location.coordinates[1];
    const lng = landmark.location.coordinates[0];

    const tours = await Tour.find({
        locations: {
            $geoWithin: {
                $centerSphere: [[lng, lat], 150 / 6378.1],
            },
        },
    }).limit(4);

    return res.status(200).json({
        status: 'success',
        length: tours.length,
        docs: {
            tours,
        },
    });
});
