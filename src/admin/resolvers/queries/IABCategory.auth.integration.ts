import { expect } from 'chai';
import { db, getServer } from '../../../test/admin-server';
import {
  clear as clearDb,
  createIABCategoryHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { GET_IAB_CATEGORIES } from './sample-queries.gql';
import { ACCESS_DENIED_ERROR, READONLY } from '../../../shared/constants';

describe('auth: IABCategory', () => {
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
      expect(result.errors).not.to.exist;

      // and data should exist
      expect(result.data).to.exist;
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
      expect(result.data).not.to.exist;

      // And there is an access denied error
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should fail if auth headers are empty', async () => {
      const server = getServer();

      const result = await server.executeOperation({
        query: GET_IAB_CATEGORIES,
      });

      // ...without success. There is no data
      expect(result.data).not.to.exist;

      // And there is an access denied error
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
    });
  });
});
