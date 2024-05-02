const { GoogleGenerativeAI } = require('@google/generative-ai');

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

const generationConfig = {
    temperature: 1,
    top_p: 0.95,
    top_k: 0,
    max_output_tokens: 8192,
};

const safetySettings = [
    {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
    },
    {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
    },
    {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
    },
    {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
    },
];

const upload = multer({ storage: fileStorage, fileFilter: fileFilter });
exports.uploadLandmarkPhoto = upload.single('photo');

exports.detect = catchAsync(async (req, res, next) => {
    let apiUrl, result;
    if (req.body.location) {
        if (req.body.location.toLowerCase() === 'alexandria') {
            apiUrl =
                'https://api-inference.huggingface.co/models/yotasr/Smart_Tour_Alex_v0.1';
        } else if (req.body.location.toLowerCase() === 'luxor') {
            apiUrl =
                'https://api-inference.huggingface.co/models/yotasr/Smart_Tour_Luxor_v1.0';
        } else if (req.body.location.toLowerCase() === 'giza') {
            apiUrl =
                'https://api-inference.huggingface.co/models/yotasr/Smart_Tour_GizaVersion1.01';
        } else if (req.body.location.toLowerCase() === 'cairo') {
            apiUrl =
                'https://api-inference.huggingface.co/models/yotasr/Smart_Tour_CairoVersion1.01';
        }
        const response = await fetch(apiUrl, {
            headers: {
                Authorization: process.env.MODEL_AUTH_TOKEN,
            },
            method: 'POST',
            body: req.file.buffer,
        });
        result = await response.json();
    }

    let jsonRes = {};
    if (process.env.GEN_AI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEN_AI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-pro-vision',
            generationConfig,
            safetySettings,
        });

        const prompt = `Suppose you are a egyptian tour guide and historian. Can you tell me the name of this \
        egyptian landmark which can be famous Mosques, famous Churches, Temples, Monuments, Archaeological Places, Tourist Attractions ex cairo tower  answer label and description none if i give you something irrelevant.\
        make your answer in form of JSON object. first key is label and value is the name,.\
        the second key is description and value is some information about the landmark. \
        Please don't add any other words. and don't change the format because it will not work for me.`;

        const image = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype,
            },
        };

        const result = await model.generateContent([prompt, image]);
        const response = await result.response;

        const text = response.text();
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');
        jsonRes = JSON.parse(text.substring(startIndex, endIndex + 1));
    }

    return res.status(200).json({
        status: 'success',
        data: {
            result,
            gemini: jsonRes,
        },
    });
});
