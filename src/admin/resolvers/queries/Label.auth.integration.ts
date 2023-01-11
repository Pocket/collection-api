import { expect } from 'chai';
import { db, getServer } from '../../../test/admin-server';
import {
  clear as clearDb,
  createLabelHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { LABELS } from './sample-queries.gql';
import { ACCESS_DENIED_ERROR, READONLY } from '../../../shared/constants';

describe('auth: Label', () => {
  beforeAll(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('labels query', () => {
    beforeAll(async () => {
      // Create some labels
      await createLabelHelper(db, 'simon-le-bon');
      await createLabelHelper(db, 'leonard-cohen');
      await createLabelHelper(db, 'john-bon-jovi');
    });

    it('should succeed if a user has only READONLY access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        // missing any collection/readoly group
        groups: `group1,group2,${READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: LABELS,
      });

      // we shouldn't have any errors
      expect(result.errors).not.to.exist;

      // and data should exist
      expect(result.data).to.exist;
    });

    it('should fail if user does not have access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        // missing any collection/readonly group
        groups: `group1,group2`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: LABELS,
      });

      // ...without success. There is no data
      expect(result.data).not.to.exist;

      // And there is an "access denied" error
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should fail if auth headers are empty', async () => {
      const server = getServer();

      const result = await server.executeOperation({
        query: LABELS,
      });

      // ...without success. There is no data
      expect(result.data).not.to.exist;

      // And there is an "access denied" error
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
    });
  });
});
