const mongoose = require('mongoose');
const startTourCompletionCron = require('./cronJobs/tourCompletion');
const redis = require('redis');

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

        // Initialize Redis client
        const redisClient = redis.createClient({
            url: process.env.REDIS_URL,
        });

        // Handle Redis client errors
        redisClient.on('error', (err) => {
            console.error('Redis Client Error', err);
        });

        await redisClient.connect();
        console.log('Connected to Redis successfully');

        startTourCompletionCron();

        server = app.listen(port, () => {
            console.log(`Starting server on port ${port}`);
        });

        const io = require('./socket').init(server);

        // Example Redis set/get to confirm connection
        await redisClient.set('key', 'value');
        const value = await redisClient.get('key');
        console.log('Redis test value:', value);
    })
    .catch((err) => {
        console.error(`Error connecting to the database: ${err}`);
    });

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
