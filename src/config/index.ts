const awsEnvironments = ['production', 'development'];
let localEndpoint;
if (!awsEnvironments.includes(process.env.NODE_ENV)) {
  localEndpoint = process.env.AWS_S3_ENDPOINT || 'http://localhost:4566';
}

export default {
  app: {
    environment: process.env.NODE_ENV || 'development',
    pagination: {
      collectionsPerPage: 30,
      authorsPerPage: 20,
      curationCategoriesPerPage: 30,
    },
    upload: {
      maxSize: 10000000, // in bytes => 10MB
      maxFiles: 10,
    },
  },
  aws: {
    s3: {
      localEndpoint,
      bucket: process.env.AWS_S3_BUCKET || 'collection-api-local-images',
    },
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
