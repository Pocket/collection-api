import { S3 } from 'aws-sdk';
import config from '../config';

export default new S3({
  endpoint: config.aws.s3.endpoint,
  region: 'us-east-1',
  s3ForcePathStyle: true,
});
