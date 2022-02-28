import { db, getServer } from '../';
import {
  clear as clearDb,
  createIABCategoryHelper,
  getServerWithMockedHeaders,
} from '../../helpers';
import { GET_IAB_CATEGORIES } from './queries.gql';
import {
  ACCESS_DENIED_ERROR,
  COLLECTION_CURATOR_FULL,
  READONLY,
} from '../../../shared/constants';

describe('queries: IABCategory', () => {
  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  const server = getServerWithMockedHeaders(headers);

  beforeAll(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getCurationCategories query', () => {
    beforeAll(async () => {
      // Create some IAB categories
      const iabParent1 = await createIABCategoryHelper(db, 'Technology');
      await createIABCategoryHelper(db, 'Internet', iabParent1);
      await createIABCategoryHelper(db, 'Wearables', iabParent1);
      await createIABCategoryHelper(db, 'Self-driving Cars', iabParent1);

      const iabParent2 = await createIABCategoryHelper(db, 'Food and Drink');
      await createIABCategoryHelper(db, 'Pizza', iabParent2);
      await createIABCategoryHelper(db, 'Chocolate', iabParent2);

      const iabParent3 = await createIABCategoryHelper(
        db,
        'Health and Wellness'
      );
      await createIABCategoryHelper(db, 'Coronavirus', iabParent3);
      await createIABCategoryHelper(db, 'Fitness', iabParent3);
    });

    it('should get IAB categories in alphabetical order', async () => {
      const {
        data: { getIABCategories: data },
      } = await server.executeOperation({
        query: GET_IAB_CATEGORIES,
      });

      // Even though we've created several IAB categories, we should only
      // receive the three parent ones back
      expect(data.length).toEqual(3);

      // The parent categories should be in alphabetical order
      expect(data[0].name).toEqual('Food and Drink');
      expect(data[1].name).toEqual('Health and Wellness');
      expect(data[2].name).toEqual('Technology');

      // And so should the child categories of each parent IAB category
      // "Food and Drink"
      expect(data[0].children.length).toEqual(2);
      expect(data[0].children[0].name).toEqual('Chocolate');
      expect(data[0].children[1].name).toEqual('Pizza');

      // "Health and Wellness"
      expect(data[1].children.length).toEqual(2);
      expect(data[1].children[0].name).toEqual('Coronavirus');
      expect(data[1].children[1].name).toEqual('Fitness');

      // "Technology"
      expect(data[2].children.length).toEqual(3);
      expect(data[2].children[0].name).toEqual('Internet');
      expect(data[2].children[1].name).toEqual('Self-driving Cars');
      expect(data[2].children[2].name).toEqual('Wearables');
    });

    it('should get all available properties of IAB categories', async () => {
      const {
        data: { getIABCategories: data },
      } = await server.executeOperation({
        query: GET_IAB_CATEGORIES,
      });

      // all the props of the first parent IAB category
      expect(data[0].externalId).toBeTruthy();
      expect(data[0].name).toBeTruthy();
      expect(data[0].slug).toBeTruthy();

      // and all the props of its first child category
      expect(data[0].children[0].externalId).toBeTruthy();
      expect(data[0].children[0].name).toBeTruthy();
      expect(data[0].children[0].slug).toBeTruthy();
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
        query: GET_IAB_CATEGORIES,
      });

      // we shouldn't have any errors
      expect(result.errors).toBeFalsy();

      // and data should exist
      expect(result.data).toBeTruthy();
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
        query: GET_IAB_CATEGORIES,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);
    });

    it('should fail if auth headers are empty', async () => {
      const server = getServer();

      const result = await server.executeOperation({
        query: GET_IAB_CATEGORIES,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);
    });
  });
});
