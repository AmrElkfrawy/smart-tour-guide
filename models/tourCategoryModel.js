const mongoose = require('mongoose');
const slugify = require('slugify');

const tourCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            unique: true,
            trim: true,
        },
        slug: String,
    },
    {
        timestamps: true,
    }
);

tourCategorySchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

const TourCategory = mongoose.model('TourCategory', tourCategorySchema);

module.exports = TourCategory;
