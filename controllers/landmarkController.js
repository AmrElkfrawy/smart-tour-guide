const Landmark = require('./../models/landmarkModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const multer = require('multer');
const sharp = require('sharp');

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

exports.resizeLandmarkPhoto = catchAsync(async (req, res, next) => {
    if (!req.files) return next();

    if (req.files.images) {
        req.body.images = [];
        await Promise.all(
            req.files.images.map(async (file, i) => {
                const imageName = `landmark-${req.user.id}-${Date.now()}-${
                    i + 1
                }.jpeg`;
                await sharp(file.buffer)
                    .resize(500, 500)
                    .toFormat('jpeg')
                    .jpeg({ quality: 90 })
                    .toFile(`public/img/landmarks/${imageName}`);
                req.body.images.push(imageName);
            })
        );
        req.files.landmarkFilenames = req.body.images;
    }
    next();
});

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
        landmark.images[parseInt(imagesIndex[i])] = images[i];
    }
    await landmark.save();
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
    }
    landmark.images = landmark.images.filter((item) => item !== null);

    if (landmark.images.length === 1 && landmark.images[0] === undefined) {
        landmark.images = [];
    }
    await landmark.save();
    res.status(200).json({
        status: 'success',
        doc: {
            landmark,
        },
    });
});
