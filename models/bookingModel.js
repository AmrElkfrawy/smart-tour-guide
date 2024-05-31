const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        tourType: {
            type: String,
            enum: ['standard', 'custom'],
            required: true,
        },
        tour: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tour',
        },
        customizedTour: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'customizedTour',
        },
        guide: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        tourDate: {
            type: Date,
            required: true,
        },
        participants: {
            type: Number,
            required: true,
            min: [1, 'Participants must be at least 1'],
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

bookingSchema.pre('save', function (next) {
    if (
        (this.tour && this.customizedTour) ||
        (!this.tour && !this.customizedTour)
    ) {
        next(
            new Error(
                'Either "tour" or "customizedTour" must be set, but not both.'
            )
        );
    } else {
        next();
    }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
