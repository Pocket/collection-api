import { expect } from 'chai';
import { getServerWithMockedHeaders } from '../../../test/helpers';
import { getServer } from '../../../test/admin-server';
import {
  ACCESS_DENIED_ERROR,
  COLLECTION_CURATOR_FULL,
  READONLY,
} from '../../../shared/constants';
import { GET_COLLECTION_STORY } from './sample-queries.gql';

// for auth tests, we are only validating success/errors on the query itself.
// either a user can see all data or can see no data.
// data-related tests can be found in the associated integration test file.
describe('auth: CollectionStory', () => {
  describe('getCollectionStory', () => {
    const storyExternalId =
      'ifAGuidIsCreatedInADatabaseButNoOneSeesItDoesItExist?';

    it('should fail if auth headers are missing', async () => {
      const server = getServer();
      const result = await server.executeOperation({
        query: GET_COLLECTION_STORY,
        variables: {
          externalId: storyExternalId,
        },
      });

      expect(result.data.getCollectionStory).not.to.exist;
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should fail if user does not have access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        // missing any collection/readoly group
        groups: `group1,group2`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_COLLECTION_STORY,
        variables: {
          externalId: storyExternalId,
        },
      });

      expect(result.data.getCollectionStory).not.to.exist;
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should succeed if user has read only access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_COLLECTION_STORY,
        variables: {
          externalId: storyExternalId,
        },
      });

      // we should get a not found error instead of a forbidden error
      expect(result.errors.length).to.equal(1);
      expect(result.errors[0].extensions.code).to.equal('NOT_FOUND');
    });

    it('should succeed if user has full access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_COLLECTION_STORY,
        variables: {
          externalId: storyExternalId,
        },
      });

      // we should get a not found error instead of a forbidden error
      expect(result.errors.length).to.equal(1);
      expect(result.errors[0].extensions.code).to.equal('NOT_FOUND');
    });
  });
});
