const express = require('express');

const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

router.post('/signup', authController.signup);
router.get('/verifyEmail/:token', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/verifyResetCode', authController.verifyResetCode);
router.patch('/resetPassword/:token', authController.resetPassword);

// protected routes
router.use(authController.protect);

router.post('/resendVerificationEmail', authController.resendVerificationEmail);
router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
    '/updateMe',
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

router.get('/:id', userController.getUser);

router
    .route('/')
    .get(authController.restrictTo('admin'), userController.getAllUsers);
router
    .route('/:id')
    .patch(authController.restrictTo('admin'), userController.updateUser)
    .delete(authController.restrictTo('admin'), userController.deleteUser);

router.use('/:subjectId/reviews', reviewRouter);

module.exports = router;
