const AppError = require('./../utils/appError');

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const deleteRedundantFile = async (file, directory) => {
    try {
        if (file !== 'default.jpg') {
            await promisify(fs.unlink)(
                path.join(__dirname, `../public/img/${directory}/${file}`)
            );
        }
    } catch (err) {
        console.log(err);
        return new AppError('Something went wrong', 500);
    }
};

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    try {
        // old code
        // let value;
        // if (err.message) {
        //     value = err.message.match(/(["'])(\\?.)*?\1/)[0];
        // }

        const duplicatedFields = [];
        for (const key in err.keyValue) {
            if (err.keyPattern.hasOwnProperty(key)) {
                duplicatedFields.push(key);
            }
        }

        // Creating the message
        let message = '';
        if (duplicatedFields.length === 1) {
            message += `This ${duplicatedFields} already exists.`;
        }
        if (duplicatedFields.length > 1) {
            message += 'You cannot post two reviews for the same landmark.';
        }

        // const message = `Duplicate field value: ${value}. Please use another value.`;
        return new AppError(message, 409);
    } catch (err) {
        return new AppError('Something went wrong', 500);
    }
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);

    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () =>
    new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, req, res) => {
    // Operational, trusted error
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    // Programming or other unknown error
    console.error('ERROR', err);
    // generic message
    return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (req.file) {
        if (req.file.userFilename)
            deleteRedundantFile(req.file.userFilename, 'users');
        if (req.file.categoryFilename)
            deleteRedundantFile(req.file.categoryFilename, 'categories');
    }

    if (req.files) {
        if (req.files.landmarkFilename)
            deleteRedundantFile(req.files.landmarkFilename, 'landmarks');
        if (req.files.landmarkFilenames)
            try {
                for (const file of req.files.landmarkFilenames) {
                    deleteRedundantFile(file, 'landmarks');
                }
            } catch (err) {
                res.status(500).json({
                    status: 'error',
                    message: 'Something went wrong',
                });
            }
    }

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = JSON.parse(JSON.stringify(err));
        error.message = err.message;

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (
            error._message === 'User validation failed' ||
            error.name === 'ValidationError'
        )
            error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};
