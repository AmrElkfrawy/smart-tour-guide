const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const Cart = require('../models/cartModel');
const Tour = require('../models/tourModel');

const calcTotalCartPrice = (cart) => {
    let totalPrice = 0;
    cart.cartItems.forEach((item) => {
        totalPrice += item.itemPrice;
    });
    cart.totalCartPrice = totalPrice;
    return totalPrice;
};

exports.addTourToCart = catchAsync(async (req, res, next) => {
    const groupSize = req.body.groupSize || 1;
    const tourDate = req.body.tourDate;
    const tour = await Tour.findById(req.body.tourId);
    if (!tour) {
        return next(
            new AppError(
                "No tour found with this ID, Couldn't add to cart",
                404
            )
        );
    }
    if (isNaN(Date.parse(tourDate)))
        return next(new AppError('Please enter a valid date', 400));

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user._id,
            cartItems: [
                {
                    tour: req.body.tourId,
                    groupSize,
                    itemPrice: tour.price * groupSize,
                    tourDate,
                },
            ],
        });
    } else {
        const tourIndex = cart.cartItems.findIndex(
            (item) => item.tour._id.toString() === req.body.tourId
        );
        if (tourIndex > -1) {
            return next(new AppError(`Tour already exist in cart`, 400));
        } else {
            cart.cartItems.push({
                tour: req.body.tourId,
                groupSize,
                itemPrice: tour.price * groupSize,
                tourDate,
            });
        }
    }

    // Calculate total cart price
    calcTotalCartPrice(cart);
    await cart.save();

    res.status(200).json({
        status: 'success',
        numOfCartItems: cart.cartItems.length,
        data: { cart },
    });
});

exports.getLoggedUserCart = catchAsync(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        return next(new AppError(`There is no cart for this user`, 404));
    }

    res.status(200).json({
        status: 'success',
        numOfCartItems: cart.cartItems.length,
        data: { cart },
    });
});

exports.removeSpecificCartItem = catchAsync(async (req, res, next) => {
    const cart = await Cart.findOneAndUpdate(
        { user: req.user._id },
        {
            $pull: { cartItems: { _id: req.params.itemId } },
        },
        { new: true }
    );
    if (!cart) {
        return next(new AppError(`There is no cart for this user`, 404));
    }

    calcTotalCartPrice(cart);
    cart.save();

    res.status(200).json({
        status: 'success',
        numOfCartItems: cart.cartItems.length,
        data: cart,
    });
});

exports.clearCart = catchAsync(async (req, res, next) => {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.status(204).send();
});

exports.updateCartItemGroupSize = catchAsync(async (req, res, next) => {
    const groupSize = req.body.groupSize;
    if (!groupSize || groupSize < 1) {
        return next(new AppError(`Please enter a valid quantity`, 400));
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        return next(new AppError(`There is no cart for current user`, 404));
    }

    const itemIndex = cart.cartItems.findIndex(
        (item) => item._id.toString() === req.params.itemId
    );
    if (itemIndex > -1) {
        const cartItem = cart.cartItems[itemIndex];
        cartItem.groupSize = groupSize;
        cart.cartItems[itemIndex] = cartItem;
        cart.cartItems[itemIndex].itemPrice =
            cart.cartItems[itemIndex].tour.price * groupSize;
    } else {
        return next(new AppError(`There is no cart item with this id`, 404));
    }

    calcTotalCartPrice(cart);

    await cart.save();

    res.status(200).json({
        status: 'success',
        numOfCartItems: cart.cartItems.length,
        data: cart,
    });
});
