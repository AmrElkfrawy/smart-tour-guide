const mongoose = require('mongoose');
const User = require('./userModel');

const normalUserSchema = new mongoose.Schema(
    {
        interests: [String],
        wishlist: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'Tour',
            },
        ],
    },
    {
        discriminatorKey: 'kind',
    }
);

const user = User.discriminator('user', normalUserSchema);

module.exports = user;
