const mongoose = require('mongoose');
const logger = require('./utils/logger');
const startTourCompletionCron = require('./cronJobs/tourCompletion');

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception, Application is terminating.');
    logger.error('Error Object:', err);
    logger.error('Error Name:', err.name);
    logger.error('Error Message:', err.message);
    logger.error('Error Stack:', err.stack);
    process.exit(1);
});

// loading environment variables
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const app = require('./app');

const dbConnection = process.env.DATABASE;
const port = process.env.PORT || 3000;
let server;
mongoose
    .connect(dbConnection)
    .then(() => {
        console.log('DB connection successful');

        startTourCompletionCron();

        server = app.listen(port, () => {
            console.log(`Starting server on port ${port}`);
        });
        const io = require('./socket').init(server);
    })
    .catch((err) => {
        console.error(`Error connecting to the database ${err}`);
    });

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection, Application is terminating.');
    logger.error('Error Object:', err);
    logger.error('Error Name:', err.name);
    logger.error('Error Message:', err.message);
    logger.error('Error Stack:', err.stack);
    server.close(() => {
        process.exit(1);
    });
});
