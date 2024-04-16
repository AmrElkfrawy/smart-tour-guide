const multer = require('multer');
const sharp = require('sharp');

const Category = require('./../models/categoryModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

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

exports.uploadCategoryPhoto = upload.single('imageCover');

exports.resizeCategoryPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    // only admin can upload images
    req.file.filename = `category-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/categories/${req.file.filename}`);

    next();
});

exports.getAllCategories = catchAsync(async (req, res, next) => {
    // EXECUTE QUERY
    const features = new APIFeatures(Category.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const categories = await features.query;

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: categories.length,
        data: {
            categories,
        },
    });
});

exports.getCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        return next(new AppError('No category found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            category,
        },
    });
});

exports.createCategory = catchAsync(async (req, res, next) => {
    if (req.file) req.body.imageCover = req.file.filename;
    const newCategory = await Category.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            category: newCategory,
        },
    });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
    if (req.file) req.body.imageCover = req.file.filename;
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!category) {
        return next(new AppError('No category found with this ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            category,
        },
    });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
        return next(new AppError('No category found with this ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
