const mongoose = require('mongoose');

const slugify = require('slugify');
const Booking = require('./bookingModel');

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
        guide: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'A tour must have a guide'],
        },
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
        bookings: {
            type: Number,
            default: 0,
        },
        slug: String,
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TourCategory',
            required: [true, 'A tour must belong to a category'],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

tourSchema.index({ location: '2dsphere' });

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'subject',
    localField: '_id',
});

tourSchema.pre(/^find/, function () {
    const excludeChain = !this.options.excludeChain;
    if (excludeChain) {
        this.populate({
            path: 'guide',
            select: 'name photo email',
        }).populate({
            path: 'category',
            select: 'name',
        });
    }
});

tourSchema.methods.checkAvailability = function (tourDate, groupSize) {
    if (!tourDate || !groupSize) return false;
    if (this.startDays.length === 0) return false;

    tourDate = new Date(tourDate);
    const tourDay = tourDate.toLocaleString('en-US', { weekday: 'long' });
    if (!this.startDays.includes(tourDay)) return false;

    const numberBookings = Booking.countDocuments({
        tour: this._id,
        tourDate,
    });

    if (this.maxGroupSize - numberBookings < groupSize) return false;
    return true;
};

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
