const Contact = require('./../models/contactModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const io = require('./../socket');

exports.createContactMessage = catchAsync(async (req, res, next) => {
    const newContactMessage = await Contact.create(req.body);
    io.getIO().of('/admin').emit('contactMessage:create', {
        action: 'create',
        data: newContactMessage,
    });

    res.status(201).json({
        status: 'success',
        data: {
            contactMessage: newContactMessage,
        },
    });
});

exports.deleteContactMessageById = catchAsync(async (req, res, next) => {
    const contactMessage = await Contact.findByIdAndDelete(req.params.id);

    if (!contactMessage) {
        return next(new AppError('No message found with this ID', 404));
    }

    io.getIO().of('/admin').emit('contactMessage:delete', {
        action: 'delete',
        data: contactMessage,
    });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

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
