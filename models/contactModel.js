const mongoose = require('mongoose');
const validator = require('validator');

const contactSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'Please provide your first name.'],
        },
        lastName: {
            type: String,
            required: [true, 'Please provide your last name.'],
        },
        email: {
            type: String,
            required: [true, 'Please provide your email.'],
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, 'Please provide a valid email'],
        },
        message: {
            type: String,
            required: [true, 'Please provide a message.'],
        },
        seen: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
