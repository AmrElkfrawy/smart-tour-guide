const cron = require('node-cron');
const CustomizedTour = require('../models/customizedTourModel');
const logger = require('../utils/logger');

const startTourCompletionCron = () => {
    cron.schedule('0 0 * * *', async () => {
        // Runs every day at midnight
        try {
            const toursToUpdate = await CustomizedTour.find({
                endDate: { $lt: new Date() },
                status: 'confirmed',
                paymentStatus: 'paid',
            });

            await Promise.all(
                toursToUpdate.map(async (tour) => {
                    tour.status = 'completed';
                    await tour.save();
                })
            );

            logger.info('Marked tours as completed:', toursToUpdate.length);
        } catch (error) {
            logger.error('Error marking tours as completed:', error);
        }
    });

    logger.info('Tour completion cron job started');
};

module.exports = startTourCompletionCron;
