import { uploadImage } from './upload';
import s3service from './s3';
import { createReadStream, unlinkSync, writeFileSync } from 'fs';
import config from '../config';

const testFilePath = __dirname + '/test-image.jpeg';

describe('Upload', () => {
  beforeEach(() => {
    writeFileSync(testFilePath, 'I am an image');
  });

  afterEach(() => {
    unlinkSync(testFilePath);
  });

  it('uploads an image to s3 using graphql FileUpload type', async () => {
    const image = {
      filename: 'test.jpeg',
      mimetype: 'image/jpeg',
      encoding: '7bit',
      createReadStream: () => createReadStream(testFilePath),
    };

    const upload = await uploadImage(s3service, image);

    expect(upload.mimeType).toEqual('image/jpeg');
    // filename should be equal the key (string after last "/" in path) in the path
    expect(upload.fileName).toEqual(/[^/]*$/.exec(upload.path)[0]);

    // Check that the returned url matches the expected pattern
    // http://localstack:4566/collection-api-local-images/cde476c9-b047-4f3b-be06-ce1c2fce9988.jpeg
    const urlPrefix = config.aws.s3.localEndpoint;
    const urlPattern = new RegExp(
      `^${urlPrefix}/${config.aws.s3.bucket}/.+.jpeg$`
    );
    expect(upload.path).toMatch(urlPattern);
  });
});
