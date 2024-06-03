const mongoose = require('mongoose');
const User = require('./userModel');

const guideSchema = new mongoose.Schema(
    {
        bio: {
            type: String,
        },
        languages: {
            type: [String],
        },
        cities: {
            type: [String],
        },
        gallery: {
            type: [String],
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        rating: {
            type: Number,
            default: 0,
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        tourRequests: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CustomizedTour',
            },
        ],
    },
    {
        discriminatorKey: 'kind',
    }
);

const guide = User.discriminator('guide', guideSchema);

module.exports = guide;
