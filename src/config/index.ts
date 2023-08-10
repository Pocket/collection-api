const awsEnvironments = ['production', 'development'];
let localEndpoint;
if (!awsEnvironments.includes(process.env.NODE_ENV)) {
  localEndpoint = process.env.AWS_S3_ENDPOINT || 'http://localhost:4566';
}

let s3path;
const bucket = process.env.AWS_S3_BUCKET || 'curated-corpus-api-local-images';

if (!awsEnvironments.includes(process.env.NODE_ENV ?? '')) {
  localEndpoint = process.env.AWS_S3_ENDPOINT || 'http://localhost:4566';
  s3path = `${localEndpoint}/${bucket}/`;
} else {
  s3path = `https://${bucket}.s3.amazonaws.com/`;
}

export default {
  app: {
    port: 4004,
    environment: process.env.NODE_ENV || 'development',
    pagination: {
      collectionsPerPage: 30,
      authorsPerPage: 20,
      partnersPerPage: 20,
    },
    collectionLabelLimit: 20,
    upload: {
      maxSize: 10000000, // in bytes => 10MB
      maxFiles: 10,
    },
    defaultLanguage: 'EN',
  },
  aws: {
    s3: {
      localEndpoint,
      bucket,
      path: s3path,
    },
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    eventBus: {
      name:
        process.env.EVENT_BUS_NAME || 'PocketEventBridge-Dev-Shared-Event-Bus',
      eventBridge: { source: 'collection-events' },
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
