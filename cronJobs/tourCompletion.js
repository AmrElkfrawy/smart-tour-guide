const cron = require('node-cron');
const CustomizedTour = require('../models/customizedTourModel'); // Adjust the path as per your project structure

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

            console.log('Marked tours as completed:', toursToUpdate.length);
        } catch (error) {
            console.error('Error marking tours as completed:', error);
        }
    });

    console.log('Tour completion cron job started');
};

module.exports = startTourCompletionCron;
