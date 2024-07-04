const mongoose = require('mongoose');
const startTourCompletionCron = require('./cronJobs/tourCompletion');

process.on('uncaughtException', (err) => {
    console.log('Uncaught exception, Application is terminating.');
    console.log('Error Object:', err);
    console.log('Error Name:', err.name);
    console.log('Error Message:', err.message);
    console.log('Error Stack:', err.stack);
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
        console.log(`Error connecting to the database ${err}`);
    });

process.on('unhandledRejection', (err) => {
    console.log('Unhandled rejection, Application is terminating.');
    console.log('Error Object:', err);
    console.log('Error Name:', err.name);
    console.log('Error Message:', err.message);
    console.log('Error Stack:', err.stack);
    server.close(() => {
        process.exit(1);
    });
});
