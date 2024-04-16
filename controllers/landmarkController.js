const Landmark = require('./../models/landmarkModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

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
exports.uploadLandmarkPhoto = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 },
]);

// exports.test = upload.array('images', 5);

exports.resizeLandmarkPhoto = catchAsync(async (req, res, next) => {
    if (!req.files) return next();

    // upload cover
    if (req.files.imageCover) {
        req.body.imageCover = `landmark-${
            req.user.id
        }-${Date.now()}-cover.jpeg`;
        await sharp(req.files.imageCover[0].buffer)
            .resize(500, 500)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/landmarks/${req.body.imageCover}`);
    }

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
    }
    next();
});

exports.getAllLandmarks = catchAsync(async (req, res, next) => {
    // EXECUTE QUERY
    if (!req.params && !req.params.categoryId)
        req.params.query.categoryId = req.body.category;
    let filter = {};
    if (req.params.categoryId) filter = { category: req.params.categoryId };
    const features = new APIFeatures(Landmark.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const landmarks = await features.query;
    // const landmarks = await features.query.explain();

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
    const landmark = await Landmark.findById(req.params.id).populate('reviews');

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
    if (!req.body.category) req.body.category = req.params.categoryId;
    const newLandmark = await Landmark.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            landmark: newLandmark,
        },
    });
});

exports.updateLandmark = catchAsync(async (req, res, next) => {
    if (req.body.editedImages) {
        const landmark = await Landmark.findById(req.params.id);
        if (!landmark) {
            return next(new AppError('No landmark found with this ID', 404));
        }

        for (let i = 0; i < Math.min(3, req.body.editedImages.length); i++) {
            if (![0, 1, 2].includes(parseInt(req.body.editedImages[i]))) {
                req.body.editedImages[i] = i;
            }
            landmark.images[parseInt(req.body.editedImages[i])] =
                req.body.images[i];
        }
        req.body.images = landmark.images;
    }

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

exports.getMostVisitedLandmarks = catchAsync(async (req, res, next) => {
    const landmarks = await Landmark.find().sort({ visitsNumber: -1 }).limit(6);
    res.status(200).json({
        status: 'success',
        data: {
            landmarks,
        },
    });
});
