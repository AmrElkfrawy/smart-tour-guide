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
        languagesSpoken: [
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
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        acceptedGuide: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
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
            select: 'name imageCover',
        })
        .populate({ path: 'respondingGuides', select: 'name photo' })
        .populate({ path: 'acceptedGuide', select: 'name photo' });
});

const CustomizedTour = mongoose.model('CustomizedTour', customizedTourSchema);

module.exports = CustomizedTour;
