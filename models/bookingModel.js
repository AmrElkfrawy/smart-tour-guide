const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
        },
        phone: {
            type: String,
            required: [true, 'Phone is required'],
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        tours: [
            {
                tour: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Tour',
                    required: [true, 'Tour is required'],
                },
                groupSize: {
                    type: Number,
                    required: [true, 'Group size is required'],
                    min: [1, 'Group size must be at least 1'],
                },
                price: {
                    type: Number,
                    required: [true, 'Price is required'],
                },
                tourDate: {
                    type: Date,
                    required: [true, 'Tour date is required'],
                },
                tourType: {
                    type: String,
                    enum: ['standard', 'customized'],
                    default: 'standard',
                },
                guide: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
            },
        ],
        status: {
            type: String,
            enum: ['confirmed', 'cancelled'],
            default: 'confirmed',
        },
        totalPrice: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

bookingSchema.pre('save', function (next) {
    if (
        (this.tours !== undefined && this.customizedTours !== undefined) ||
        (this.tours === undefined && this.customizedTours === undefined)
    ) {
        next(
            new Error(
                'Either "tours" or "customizedTours" must be set, but not both.'
            )
        );
    } else {
        next();
    }
});

bookingSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'firstName lastName email',
    })
        .populate({
            path: 'tours.tour',
            select: 'name images duration',
            options: { excludeChain: true },
        })
        .populate({
            path: 'tours.guide',
            select: 'name email photo',
        });

    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
