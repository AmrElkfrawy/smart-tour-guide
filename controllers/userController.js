const fs = require('fs');
const path = require('path');

const directory = 'public/img/users';

// Create the directory if it doesn't exist
if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
}

// Packages
const multer = require('multer');

// models
const User = require('./../models/userModel');

// utils
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img/users');
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1];
        cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
    },
});

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
exports.getUser = catchAsync(async (req, res, next) => {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }
    res.status(500).json({
        status: 'success',
        data: {
            user,
        },
    });
});

exports.updateMe = catchAsync(async (req, res, next) => {
    console.log(req.file);
    console.log(req.body);

    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword.',
                400
            )
        );
    }

    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        {
            new: true,
            runValidators: true,
        }
    );

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
