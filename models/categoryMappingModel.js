const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const categoryMappingSchema = new Schema({
    landmarkCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        unique: true,
    },
    tourCategories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TourCategory',
        },
    ],
});

similaritySchema.pre(/^find/, function (next) {
    this.populate({
        path: 'landmarkCategory',
        select: 'name',
    }).populate({
        path: 'tourCategories',
        select: 'name',
    });
    next();
});

module.exports = mongoose.model('CategoryMapping', categoryMappingSchema);
