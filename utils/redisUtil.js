const redis = require('redis');
let redisClient = redis.createClient({ url: process.env.REDIS_URL });

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Error connecting to Redis:', err);
    }
})();

module.exports = redisClient;
