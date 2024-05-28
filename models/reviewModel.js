const landmarkModel = require('./landmarkModel');

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the user who left the review
            required: [true, 'Review must have user'],
        },
        landmark: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Landmark', // Reference to the landmark being reviewed
        },
        tour: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tour', // Reference to the tour being reviewed
        },
        guide: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the guide being reviewed
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
    },
    {
        timestamps: true,
    }
);

reviewSchema.index({ user: 1, landmark: 1 });
reviewSchema.index({ user: 1, tour: 1 });
reviewSchema.index({ user: 1, guide: 1 });

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
            rating: stats[0].avgRating,
        });
    } else {
        await landmarkModel.findByIdAndUpdate(landmarkId, {
            ratingsQuantity: 0,
            rating: 4,
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
