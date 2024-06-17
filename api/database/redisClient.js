const redis = require('redis');
const client = redis.createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

client.on('error', (err) => {
    console.log('Redis client error:', err);
});

client.on('ready', () => {
    console.log('Redis client ready');
});

(async () => {
    await client.connect();
})();

module.exports = client;
