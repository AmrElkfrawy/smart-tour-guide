const landmarkModel = require('./landmarkModel');
const tourModel = require('./tourModel');

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
        reviewType: {
            type: String,
            enum: ['landmark', 'tour', 'guide'],
            required: true,
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

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo',
    });
    next();
});

reviewSchema.statics.calcAverageRatings = async function (
    entityId,
    entityType
) {
    const stats = await this.aggregate([
        {
            $match: { [entityType]: entityId },
        },
        {
            $group: {
                _id: `$${entityType}`,
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
    if (entityType === 'landmark') {
        model = landmarkModel;
    } else if (entityType === 'tour') {
        model = tourModel;
    }

    await model.findByIdAndUpdate(entityId, updateData);
};

reviewSchema.post('save', function () {
    if (this.type === 'landmark')
        this.constructor.calcAverageRatings(this.landmark, 'landmark');
    else if (this.type === 'tour')
        this.constructor.calcAverageRatings(this.tour, 'tour');
    else if (this.type === 'guide')
        this.constructor.calcAverageRatings(this.guide, 'guide');
});

reviewSchema.post(/^findOneAnd/, async (doc) => {
    if (doc.type === 'landmark')
        await doc.constructor.calcAverageRatings(doc.landmark, 'landmark');
    else if (doc.type === 'tour')
        await doc.constructor.calcAverageRatings(doc.tour, 'tour');
    else if (doc.type === 'guide')
        await doc.constructor.calcAverageRatings(doc.guide, 'guide');
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
