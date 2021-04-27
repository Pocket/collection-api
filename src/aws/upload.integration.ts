import { uploadImage } from './upload';
import s3 from './s3';
import { FileUpload } from 'graphql-upload';
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
    const image: FileUpload = {
      filename: 'test.jpeg',
      mimetype: 'image/jpeg',
      encoding: '7bit',
      createReadStream: () => createReadStream(testFilePath),
    };

    const upload = await uploadImage(s3, image);

    // Check the fileName and mimeType matches expected
    expect(upload).toEqual(
      expect.objectContaining({ fileName: 'test.jpeg', mimeType: 'image/jpeg' })
    );

    // Check that the returned url matches the expected pattern
    // http://localstack:4566/collection-api-local-images/cde476c9-b047-4f3b-be06-ce1c2fce9988.jpeg
    const urlPrefix = config.aws.s3.endpoint.replace(/\//g, '/');
    const urlPattern = new RegExp(
      `^${urlPrefix}/${config.aws.s3.bucket}/.+.jpeg$`
    );
    expect(upload.url).toMatch(urlPattern);
  });
});
