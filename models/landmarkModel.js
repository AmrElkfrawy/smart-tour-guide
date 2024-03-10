const mongoose = require('mongoose');
const slugify = require('slugify');

const landmarkSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A landmark must have a name'],
        unique: true,
        minLength: [
            5,
            'A landmark name must have more than or equal to 5 characters',
        ],
        maxLength: [
            60,
            'A landmark name must have less than or equal to 60 characters',
        ],
    },
    description: {
        type: String,
        trim: true,
    },
    imageCover: {
        type: String,
        required: [true, 'A landmark must have an image cover'],
    },
    images: [String],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'A landmark must have a category'],
    },
    location: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point'],
        },
        // longitude, latitude
        coordinates: [Number],
        governorate: String,
    },

    rating: {
        type: Number,
        default: 4.5,
    },
    ratingsAverage: {
        type: Number,
        default: 0,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating must be at most 5'],
    },
    ratingsQuantity: {
        type: Number,
        default: 0,
    },
    slug: String,
});

landmarkSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true }); // this keyword points to the current document being processed
    next();
});

const Landmark = mongoose.model('Landmark', landmarkSchema);

module.exports = Landmark;
