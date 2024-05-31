const mongoose = require('mongoose');
const User = require('./userModel');

const normalUserSchema = new mongoose.Schema({
    interests: [String],
    wishlist: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
        },
    ],
});

const user = User.discriminator('user', normalUserSchema);

module.exports = user;
