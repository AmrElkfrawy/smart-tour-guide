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
    let apiUrl;
    if (req.body.location === 'Alexandria') {
        apiUrl =
            'https://api-inference.huggingface.co/models/yotasr/Smart_Tour_Alex_v0.1';
    }
    const response = await fetch(apiUrl, {
        headers: {
            Authorization: process.env.MODEL_AUTH_TOKEN,
        },
        method: 'POST',
        body: req.file.buffer,
    });
    const result = await response.json();

    return res.status(200).json({
        status: 'success',
        data: {
            result,
        },
    });
});
