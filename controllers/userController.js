const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const directory = 'public/img/users';

// Create the directory if it doesn't exist
if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
}

// Packages
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');

// models
const User = require('./../models/userModel');
const Guide = require('./../models/guideModel');

// utils
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

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
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
    try {
        if (!req.file) return next();

        let cld_upload_stream = cloudinary.uploader.upload_stream(
            {
                folder: 'users',
                transformation: [
                    { width: 500, height: 500, gravity: 'auto', crop: 'fill' },
                ],
            },
            function (error, result) {
                req.file.filename = result.secure_url;
                req.file.photoId = result.public_id;
                return next();
            }
        );
        streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
    } catch (err) {
        return res.status(400).json({
            status: 'fail',
            message: 'Error processing image',
        });
    }
};

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword.',
                400
            )
        );
    }

    const filteredBody = filterObj(req.body, 'name', 'email', 'bio', 'test');
    if (req.file) {
        filteredBody.photo = req.file.filename;
        filteredBody.photoId = req.file.photoId;
    }

    const updateOperations = { $set: filteredBody };

    if (req.body.newLanguage) {
        if (!updateOperations.$addToSet) {
            updateOperations.$addToSet = { languages: req.body.newLanguage };
        } else {
            updateOperations.$addToSet.languages = req.body.newLanguage;
        }
    }

    if (req.body.newGovernorate) {
        if (!updateOperations.$addToSet) {
            updateOperations.$addToSet = {
                governorates: req.body.newGovernorate,
            };
        } else {
            updateOperations.$addToSet.governorates = req.body.newGovernorate;
        }
    }

    let updatedUser;

    if (req.user.role == 'guide') {
        updatedUser = await Guide.findByIdAndUpdate(
            req.user.id,
            updateOperations,
            {
                new: true,
                runValidators: true,
            }
        );
    } else {
        updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updateOperations,
            {
                new: true,
                runValidators: true,
            }
        );
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.createUser = catchAsync(async (req, res, next) => {
    const { name, email, password, role } = req.body;
    newUser = await User.create({
        name,
        email,
        password,
        role,
        emailVerified: true,
        passwordConfirm: password,
    });

    newUser.password = undefined;
    newUser.passwordConfirm = undefined;

    return res.json({
        status: 'success',
        doc: newUser,
    });
});
