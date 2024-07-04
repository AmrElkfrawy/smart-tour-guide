const mongoose = require('mongoose');

// Define schema for the Customized Tour model
const customizedTourSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        governorate: {
            type: String,
            required: true,
        },
        spokenLanguages: [
            {
                type: String,
                required: true,
            },
        ],
        groupSize: {
            type: String,
            enum: ['1-4', '5-10', 'More than 10'],
            required: true,
        },
        landmarks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Landmark',
            },
        ],
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        commentForGuide: {
            type: String,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'completed', 'cancelled'],
            default: 'pending',
        },
        respondingGuides: [
            {
                guide: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                price: {
                    type: Number,
                    required: [true, 'You must provide a price proposal.'],
                },
            },
        ],
        acceptedGuide: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        price: Number, // Proposed price by the guide
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid'],
            default: 'pending',
        },
        sentRequests: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        guideConfirmCompletion: {
            type: Boolean,
            default: false,
        },
        userConfirmCompletion: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

customizedTourSchema.pre(/^find/, function () {
    this.populate({
        path: 'user',
        select: 'name photo',
    })
        .populate({
            path: 'landmarks',
            select: 'name images',
        })
        .populate({
            path: 'respondingGuides.guide',
            select: 'name photo rating ratingsQuantity',
        })
        .populate({
            path: 'acceptedGuide',
            select: 'name photo rating ratingsQuantity',
        });
    // .populate({ path: 'sentRequests', select: 'name photo' });
});

const CustomizedTour = mongoose.model('CustomizedTour', customizedTourSchema);

module.exports = CustomizedTour;
