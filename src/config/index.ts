export default {
  app: {
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 0,
  },
  slugify: { lower: true, remove: /[*+~.()'"!:@]/g },
  redis: {
    primaryEndpoint: process.env.REDIS_PRIMARY_ENDPOINT || 'redis',
    readerEndpoint: process.env.REDIS_READER_ENDPOINT || 'redis',
    port: process.env.REDIS_PORT ?? 6379,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
};
