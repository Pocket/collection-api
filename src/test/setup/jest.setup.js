const config = {
  NODE_ENV: 'test',
  AWS_ACCESS_KEY_ID: 'localstack-fake-id',
  AWS_DEFAULT_REGION: 'us-east-1',
  AWS_REGION: 'us-east-1',
  AWS_S3_ENDPOINT: 'http://localstack:4566',
  AWS_S3_BUCKET: 'collection-api-local-images',
  AWS_SECRET_ACCESS_KEY: 'localstack-fake-key',
  LOCALSTACK_API_KEY: 'another-fake-key',
  AWS_XRAY_CONTEXT_MISSING: 'LOG_ERROR',
  AWS_XRAY_LOG_LEVEL: 'silent',
  DATABASE_URL: 'mysql://root:@mysql:3306/collections?connect_timeout=300',
};

module.exports = async () => {
  // ...
  // Set reference to current env variables in order to restore them during teardown.
  global.__ENV__ = Object.assign({}, process.env);
  for (const [key, val] of Object.entries(config)) {
    process.env[key] = val;
  }
};
