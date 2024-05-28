const multer = require('multer');
const sharp = require('sharp');

const Category = require('./../models/categoryModel');
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

    req.body.imageCover = req.file.categoryFilename;
    next();
});

exports.getAllCategories = factory.getAll(Category);
exports.getCategory = factory.getOne(Category);
exports.createCategory = factory.createOne(Category);
exports.deleteCategory = factory.deleteOne(Category);
exports.updateCategory = factory.updateOne(Category);
