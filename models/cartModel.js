const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
    {
        cartItems: [
            {
                tour: {
                    type: mongoose.Schema.ObjectId,
                    ref: 'Tour',
                    required: [true, 'Item must belong to a tour'],
                },
                groupSize: {
                    type: Number,
                    default: 1,
                    min: [1, 'Group size must be at least 1'],
                    max: [10, 'Group size must be at most 10'],
                },
                itemPrice: Number,
                tourDate: {
                    type: Date,
                    required: [true, 'Tour date is required'],
                },
            },
        ],

        totalCartPrice: Number,
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

cartSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'cartItems.tour',
        select: 'name price images guide duration',
        options: { excludeChain: true },
    });
    next();
});

module.exports = mongoose.model('Cart', cartSchema);
