const Contact = require('./../models/contactModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

exports.createContactMessage = factory.createOne(Contact);
exports.deleteContactMessageById = factory.deleteOne(Contact);

exports.getContactMessageById = catchAsync(async (req, res, next) => {
    const contactMessage = await Contact.findByIdAndUpdate(
        req.params.id,
        { seen: true },
        { new: true, runValidators: true }
    );

    if (!contactMessage) {
        return next(new AppError('No message found with this ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            contactMessage,
        },
    });
});

exports.getAllContactMessages = catchAsync(async (req, res, next) => {
    const contactMessages = await Contact.find();
    const unseenCount = await Contact.countDocuments({ seen: false });

    res.status(200).json({
        status: 'success',
        results: contactMessages.length,
        unseenCount,
        data: {
            contactMessages,
        },
    });
});
