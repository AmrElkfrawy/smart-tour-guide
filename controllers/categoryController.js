const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');

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

exports.resizeCategoryPhoto = (req, res, next) => {
    try {
        if (!req.file) return next();

        let cld_upload_stream = cloudinary.uploader.upload_stream(
            {
                folder: 'categories',
                transformation: [
                    { width: 600, height: 600, gravity: 'auto', crop: 'fill' },
                ],
            },
            function (error, result) {
                req.body.imageCover = result.secure_url;
                req.body.imageCoverId = result.public_id;
                return next();
            }
        );
        streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

exports.getAllCategories = factory.getAll(Category);
exports.getCategory = factory.getOne(Category);
exports.createCategory = factory.createOne(Category);
exports.deleteCategory = factory.deleteOne(Category);
exports.updateCategory = factory.updateOne(Category);
