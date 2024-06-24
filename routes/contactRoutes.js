const express = require('express');
const contactController = require('../controllers/contactController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/', contactController.createContactMessage);

router.use(authController.protect, authController.restrictTo('admin'));
router.get('/', contactController.getAllContactMessages);
router
    .route('/:id')
    .get(contactController.getContactMessageById)
    .delete(contactController.deleteContactMessageById);

module.exports = router;
