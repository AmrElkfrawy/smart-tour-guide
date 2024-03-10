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

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo',
    });
    next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
