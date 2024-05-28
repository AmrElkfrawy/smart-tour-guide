const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration'],
        },
        images: [String],
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        price: {
            type: Number,
            required: [true, 'A tour must have a price'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size'],
        },
        startDays: [
            {
                type: String,
                enum: [
                    'Sunday',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                ],
                required: [true, 'A tour must have a start day'],
            },
        ],
        guides: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        rating: {
            type: Number,
            default: 4,
            min: [0, 'Rating must be at least 1'],
            max: [5, 'Rating must be at most 5'],
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        slug: String,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

tourSchema.index({ location: '2dsphere' });

tourSchema.pre(/^find/, function () {
    this.populate({
        path: 'guides',
        select: 'name photo role email',
    });
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
