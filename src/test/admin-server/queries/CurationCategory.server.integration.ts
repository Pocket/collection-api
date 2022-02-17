import { db, getServer } from '../';
import {
  clear as clearDb,
  createCurationCategoryHelper,
  getServerWithMockedHeaders,
} from '../../helpers';
import { GET_CURATION_CATEGORIES } from './queries.gql';
import {
  ACCESS_DENIED_ERROR,
  COLLECTION_CURATOR_FULL,
  READONLY,
} from '../../../shared/constants';

describe('queries: CurationCategory', () => {
  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  const server = getServerWithMockedHeaders(headers);

  beforeAll(async () => {
    await clearDb(db);
    await server.start();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  describe('getCurationCategories query', () => {
    beforeAll(async () => {
      // Create some curation categories
      await createCurationCategoryHelper(db, 'Technology');
      await createCurationCategoryHelper(db, 'Business');
      await createCurationCategoryHelper(db, 'Food and Drink');
      await createCurationCategoryHelper(db, 'Climate Change');
    });

    it('should get curation categories in alphabetical order', async () => {
      const {
        data: { getCurationCategories: data },
      } = await server.executeOperation({
        query: GET_CURATION_CATEGORIES,
      });

      expect(data[0].name).toEqual('Business');
      expect(data[1].name).toEqual('Climate Change');
      expect(data[2].name).toEqual('Food and Drink');
      expect(data[3].name).toEqual('Technology');
    });

    it('should get all available properties of curation categories', async () => {
      const {
        data: { getCurationCategories: data },
      } = await server.executeOperation({
        query: GET_CURATION_CATEGORIES,
      });

      expect(data[0].externalId).toBeTruthy();
      expect(data[0].name).toBeTruthy();
      expect(data[0].slug).toBeTruthy();
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
        query: GET_CURATION_CATEGORIES,
      });

      // we shouldn't have any errors
      expect(result.errors).toBeFalsy();

      // and data should exist
      expect(result.data).toBeTruthy();

      await server.stop();
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
        query: GET_CURATION_CATEGORIES,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it('should fail if auth headers are empty', async () => {
      const server = getServer();
      await server.start();

      const result = await server.executeOperation({
        query: GET_CURATION_CATEGORIES,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);

      await server.stop();
    });
  });
});
