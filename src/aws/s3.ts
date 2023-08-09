import { S3 } from '@aws-sdk/client-s3';
import config from '../config';

export default new S3({
  endpoint: config.aws.s3.localEndpoint,
  region: 'us-east-1',
  forcePathStyle: true,
});
