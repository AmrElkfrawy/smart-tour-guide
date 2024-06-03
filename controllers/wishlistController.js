const User = require('../models/normalUserModel');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.addToWishlist = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.body.tourId);
    if (!tour) {
        return next(
            new AppError(
                "No tour found with this ID, Couldn't add to wishlist",
                404
            )
        );
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet: { wishlist: req.body.tourId },
        },
        { new: true }
    ).populate({
        path: 'wishlist',
        select: 'name images price',
        options: { excludeChain: true },
    });
    res.status(200).json({
        status: 'success',
        results: user.wishlist.length,
        data: user.wishlist,
    });
});

exports.removeFromWishlist = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $pull: { wishlist: req.params.id },
        },
        { new: true }
    ).populate({
        path: 'wishlist',
        select: 'name images price',
        options: { excludeChain: true },
    });
    if (!user) {
        return next(new AppError('No wishlist item found', 404));
    }
    res.status(200).json({
        status: 'success',
        results: user.wishlist.length,
        data: user.wishlist,
    });
});

exports.getWishlist = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate({
        path: 'wishlist',
        select: 'name images price',
        options: { excludeChain: true },
    });
    res.status(200).json({
        status: 'success',
        results: user.wishlist.length,
        data: user.wishlist,
    });
});
