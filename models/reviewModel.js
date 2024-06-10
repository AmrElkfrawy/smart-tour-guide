const landmarkModel = require('./landmarkModel');
const tourModel = require('./tourModel');
const guideModel = require('./guideModel');

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review must have a user'],
    },
    reviewType: {
        type: String,
        enum: ['Landmark', 'User', 'Tour'],
        required: [true, 'Review must have a type'],
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Review must have a subject'],
        refPath: 'reviewType',
    },
    rating: {
        type: Number,
        required: true,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating must be at most 5'],
    },
    comment: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

reviewSchema.index({ user: 1, subject: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo',
    });
    next();
});

reviewSchema.statics.calcAverageRatings = async function (
    subjectId,
    reviewType
) {
    const stats = await this.aggregate([
        {
            $match: { subject: subjectId },
        },
        {
            $group: {
                _id: '$subject',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    const updateData = {
        ratingsQuantity: stats.length > 0 ? stats[0].nRating : 0,
        rating: stats.length > 0 ? stats[0].avgRating : 4,
    };

    let model;
    if (reviewType === 'Landmark') {
        model = landmarkModel;
    } else if (reviewType === 'Tour') {
        model = tourModel;
    } else if (reviewType === 'Guide') {
        model = guideModel;
    }

    await model.findByIdAndUpdate(subjectId, updateData);
};

reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.subject, this.reviewType);
});

reviewSchema.post(/^findOneAnd/, async (doc) => {
    if (doc) {
        await doc.constructor.calcAverageRatings(doc.subject, doc.reviewType);
    }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
