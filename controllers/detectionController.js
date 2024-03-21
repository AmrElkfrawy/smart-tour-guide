const catchAsync = require('../utils/catchAsync');
const multer = require('multer');

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
exports.uploadLandmarkPhoto = upload.single('photo');

exports.detect = catchAsync(async (req, res, next) => {
    console.log('here', req.file);
    let apiUrl;
    console.log('as', req.file.buffer);
    if (req.body.location.toLowerCase() === 'alexandria') {
        apiUrl =
            'https://api-inference.huggingface.co/models/yotasr/Smart_Tour_Alex_v0.1';
    } else if (req.body.location.toLowerCase() === 'luxor') {
        apiUrl =
            'https://api-inference.huggingface.co/models/yotasr/Smart_Tour_Luxor_v1.0';
    } else if (req.body.location.toLowerCase() === 'giza') {
        apiUrl =
            'https://api-inference.huggingface.co/models/yotasr/Smart_Tour_GizaVersion1.01';
    }

    const response = await fetch(apiUrl, {
        headers: {
            Authorization: process.env.MODEL_AUTH_TOKEN,
        },
        method: 'POST',
        body: req.file.buffer,
    });
    let result = await response.json();
    if (req.user.role === 'user') {
        result = result[0];
    }
    return res.status(200).json({
        status: 'success',
        data: {
            result,
        },
    });
});