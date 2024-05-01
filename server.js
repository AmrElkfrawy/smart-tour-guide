const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
    console.log('Uncaught exception, Application is terminating.');
    console.log(err.name, err.message);
    console.log(err.stack);
    process.exit(1);
});

// loading environment variables
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const app = require('./app');

const dbConnection = process.env.DATABASE;

mongoose
    .connect(dbConnection)
    .then(() => {
        console.log('DB connection successful');
    })
    .catch((err) => {
        console.log(`Error connecting to the database ${err}`);
    });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Starting server on port ${port}`);
});

process.on('unhandledRejection', (err) => {
    console.log('Unhandled rejection, Application is terminating.');
    console.log(err.name, err.message);
    console.log(err.stack);
    server.close(() => {
        process.exit(1);
    });
});
