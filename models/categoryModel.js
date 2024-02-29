const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A category must have a name'],
        unique: true,
        minLength: [
            5,
            'A category name must have more than or equal to 5 characters',
        ],
        maxLength: [
            60,
            'A category name must have less than or equal to 60 characters',
        ],
    },
    imageCover: {
        type: String,
        required: [true, 'A category must have an image cover'],
    },
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
