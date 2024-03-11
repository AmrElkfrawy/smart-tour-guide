const landmarkModel = require('./landmarkModel');

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the user who left the review
        required: [true, 'Review must have user'],
    },
    landmark: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Landmark', // Reference to the landmark being reviewed
        required: [true, 'Review must have landmark'],
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

reviewSchema.index({ landmark: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo',
    });
    next();
});
reviewSchema.statics.calcAverageRatings = async function (landmarkId) {
    const stats = await this.aggregate([
        {
            $match: { landmark: landmarkId },
        },
        {
            $group: {
                _id: '$landmark',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);
    // console.log(stats);
    if (stats.length > 0) {
        await landmarkModel.findByIdAndUpdate(landmarkId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating,
        });
    } else {
        await landmarkModel.findByIdAndUpdate(landmarkId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5,
        });
    }
};

reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.landmark);
});

reviewSchema.post(/^findOneAnd/, async (doc) => {
    await doc.constructor.calcAverageRatings(doc.landmark);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
