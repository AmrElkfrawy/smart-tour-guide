const landmarkModel = require('./landmarkModel');
const tourModel = require('./tourModel');
const guideModel = require('./guideModel');

const mongoose = require('mongoose');
const User = require('./userModel');

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

// Ensure unique review per user, subject, and reviewType
reviewSchema.index({ subject: 1, user: 1, reviewType: 1 }, { unique: true });

reviewSchema.pre('save', async function (next) {
    if (this.reviewType === 'User') {
        const guide = await User.findById(this.subject);
        if (!guide || guide.role !== 'guide') {
            return next(
                new Error(
                    'Reviews can only be left for users with the guide role'
                )
            );
        }
    }
    next();
});

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
            $match: { subject: subjectId, reviewType: reviewType },
        },
        {
            $group: {
                _id: '$subject',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    const updateData =
        stats.length > 0
            ? {
                  ratingsQuantity: stats[0].nRating,
                  rating: stats[0].avgRating,
              }
            : {
                  ratingsQuantity: 0,
                  rating: 4,
              };

    let Model;

    if (reviewType === 'Landmark') {
        Model = landmarkModel;
    } else if (reviewType === 'User') {
        Model = guideModel;
    } else if (reviewType === 'Tour') {
        Model = tourModel;
    }
    await Model.findByIdAndUpdate(subjectId, updateData);
};

reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.subject, this.reviewType);
});

reviewSchema.post(/^findOneAnd/, async (doc) => {
    await doc.constructor.calcAverageRatings(doc.subject, doc.reviewType);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
