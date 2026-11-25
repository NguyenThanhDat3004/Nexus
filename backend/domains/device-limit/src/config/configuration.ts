export default () => ({
  port: parseInt(process.env.PORT ?? '3004', 10),
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  pinHash: process.env.DEVICE_LIMIT_PIN_HASH || '',
});
