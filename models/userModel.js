const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please tell us your name!'],
        },
        email: {
            type: String,
            required: [true, 'Please provide your email'],
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, 'Please provide a valid email'],
        },
        photo: {
            type: String,
            default: 'default.jpg',
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'guide'],
            default: 'user',
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: 8,
            select: false,
        },
        passwordConfirm: {
            type: String,
            required: [true, 'Please confirm your password'],
            validate: {
                validator: function (el) {
                    return el === this.password;
                },
                message: 'Passwords are not the same!',
            },
        },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetTokenExpires: Date,
        passwordResetCode: String,
        passwordResetCodeExpires: Date,
        emailVerificationToken: {
            type: String,
            select: false,
        },
        verificationTokenExpires: {
            type: Date,
            select: false,
        },
        emailVerified: {
            type: Boolean,
            default: true,
        },
        active: {
            type: Boolean,
            default: true,
            select: false,
        },
    },
    {
        timestamps: true,
        discriminatorKey: 'kind',
    }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});
userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );

        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

userSchema.methods.createPasswordResetCode = function () {
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit random code

    this.passwordResetCode = resetCode;
    this.passwordResetCodeExpires = Date.now() + 2 * 60 * 1000;
    return resetCode;
};

userSchema.methods.createEmailVerificationToken = function () {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // Expires in 24 hours

    return verificationToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
