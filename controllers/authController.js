// packages
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
// models
const User = require('./../models/userModel');
const NormalUser = require('./../models/normalUserModel');
const Guide = require('./../models/guideModel');
// utils
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);

    // delete password
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    let newUser;
    if (req.body.role === 'guide') {
        newUser = await Guide.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
            role: 'guide',
        });
    } else {
        newUser = await NormalUser.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
        });
    }

    return createSendToken(newUser, 201, req, res, next);

    /*
    const verifyEmailToken = newUser.createEmailVerificationToken();

    try {
        const verificationURL = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/users/verifyEmail/${verifyEmailToken}`;
        const message = `Welcome to our application! Please verify your email address by clicking the following link: ${verificationURL}`;

        await sendEmail({
            email: newUser.email,
            subject: 'Verify your email address',
            message,
        });

        // Send response indicating successful user creation and send token
        await newUser.save({ validateBeforeSave: false });
        newUser.emailVerificationToken = undefined;
        newUser.verificationTokenExpires = undefined;
        createSendToken(newUser, 201, req, res, next);
    } catch (err) {
        // If there's an error sending the email, handle it
        newUser.emailVerificationToken = undefined;
        newUser.verificationTokenExpires = undefined;
        await newUser.save({ validateBeforeSave: false });

        return next(
            new AppError(
                'There was an error sending the verification email. Try again later!',
                500
            )
        );
    }*/
});

exports.resendVerificationEmail = catchAsync(async (req, res, next) => {
    res.status(200).json({
        status: 'success',
        message: 'Verification email resent successfully.',
    });
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
        return next(new AppError('User not found', 400));
    }
    if (user.emailVerified) {
        return next(new AppError('Email is already verified', 400));
    }

    const verifyEmailToken = user.createEmailVerificationToken();

    await user.save({ validateBeforeSave: false });

    try {
        const verificationURL = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/users/verifyEmail/${verifyEmailToken}`;
        const message = `Welcome back! Please verify your email address by clicking the following link: ${verificationURL}`;
        await sendEmail({
            email: user.email,
            subject: 'Resend Verification Email',
            message,
        });

        res.status(200).json({
            status: 'success',
            message: 'Verification email resent successfully.',
        });
    } catch (err) {
        user.emailVerificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError(
                'There was an error sending the verification email. Try again later!',
                500
            )
        );
    }
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
    const token = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    // Find the user by the verification token
    const user = await User.findOne({
        emailVerificationToken: token,
        verificationTokenExpires: { $gt: Date.now() },
    });

    // If user not found or token has expired
    if (!user) {
        return next(
            new AppError('Verification token is invalid or has expired.', 400)
        );
    }

    // If the user is already verified, return a message indicating that
    if (user.emailVerified) {
        return res.status(200).json({
            status: 'success',
            message:
                'Your email address has already been verified. You can log in.',
        });
    }

    // Mark user as email verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Send response indicating successful email verification
    res.status(200).json({
        status: 'success',
        message: 'Email verification successful. You can now log in.',
    });
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(user, 200, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
    // get the token
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(
            new AppError(
                'You are not logged in! Please log in to get access.',
                401
            )
        );
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                'The user belonging to this token does no longer exist.',
                401
            )
        );
    }
    /*
    // Check if email is verified
    if (!currentUser.emailVerified && req.path !== '/resendVerificationEmail') {
        return next(
            new AppError(
                'Please verify your email address to access this resource.',
                401
            )
        );
    }
    */

    // check if token issued before changing password
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                'User recently changed password! Please log in again.',
                401
            )
        );
    }

    // authorized
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You do not have permission to perform this action',
                    403
                )
            );
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    if (!req.body.email) {
        return next(new AppError('Please provide email', 400));
    }
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with that email', 404));
    }

    const resetCode = user.createPasswordResetCode();
    await user.save({ validateBeforeSave: false });

    try {
        const message = `Your password reset code is ${resetCode}. Please use this code to reset your password.`;
        await sendEmail({
            email: user.email,
            subject: 'Reset password (valid for 2 mins)',
            message,
        });

        res.status(200).json({
            status: 'success',
            message: 'Code sent to email!',
        });
    } catch (err) {
        user.passwordResetCode = undefined;
        user.passwordResetCodeExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError(
                'There was an error sending the email. Try again later!'
            ),
            500
        );
    }
});

exports.verifyResetCode = catchAsync(async (req, res, next) => {
    const code = req.body.code;

    const user = await User.findOne({
        passwordResetCode: code,
        passwordResetCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
        return next(new AppError('Code is invalid or has expired.', 400));
    }

    const resetToken = user.createPasswordResetToken();
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        resetToken,
    });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    // Check if the new password is the same as the current password
    const isSamePassword = await user.correctPassword(
        req.body.password,
        user.password
    );

    if (isSamePassword) {
        return next(
            new AppError(
                'New password must be different from the current password',
                400
            )
        );
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;
    await user.save();

    createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    if (!req.body.passwordCurrent) {
        return next(new AppError('Please enter your current password.', 400));
    }
    if (
        !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
        return next(new AppError('Your current password is wrong.', 401));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createSendToken(user, 200, req, res);
});
