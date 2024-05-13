const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const multer = require('multer');
const sharp = require('sharp');

const Category = require('./../models/categoryModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const factory = require('./handlerFactory');

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
    req.file.categoryFilename = `category-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/categories/${req.file.categoryFilename}`);

    next();
});

exports.setImageCoverToBody = (req, res, next) => {
    if (req.file) req.body.imageCover = req.file.categoryFilename;
    next();
};

exports.getAllCategories = factory.getAll(Category);
exports.getCategory = factory.getOne(Category);
exports.createCategory = factory.createOne(Category);
exports.deleteCategory = factory.deleteOne(Category);

exports.updateCategory = catchAsync(async (req, res, next) => {
    if (req.file) {
        const category = await Category.findById(req.params.id);
        req.file.oldPhoto = category.imageCover;
        req.body.imageCover = req.file.categoryFilename;
    }

    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!category) {
        return next(new AppError('No category found with this ID', 404));
    }

    if (req.file) {
        req.file.categoryFilename = undefined;
        await promisify(fs.unlink)(
            path.join(
                __dirname,
                `../public/img/categories/${req.file.oldPhoto}`
            )
        );
    }

    res.status(200).json({
        status: 'success',
        data: {
            category,
        },
    });
});
