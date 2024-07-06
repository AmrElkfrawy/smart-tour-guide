const mongoose = require('mongoose');
const startTourCompletionCron = require('./cronJobs/tourCompletion');

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception, Application is terminating.');
    console.error('Error Object:', err);
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    process.exit(1);
});

// Load environment variables
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const app = require('./app');

const dbConnection = process.env.DATABASE;
const port = process.env.PORT || 3000;
let server;

mongoose
    .connect(dbConnection)
    .then(async () => {
        console.log('DB connection successful');
        startTourCompletionCron();
    })
    .catch((err) => {
        console.error(`Error connecting to the database: ${err}`);
    });

server = app.listen(port, () => {
    console.log(`Starting server on port ${port}`);
});
const io = require('./socket').init(server);

process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection, Application is terminating.');
    console.error('Error Object:', err);
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    server.close(() => {
        process.exit(1);
    });
});
