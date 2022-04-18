import { expect } from 'chai';
import { db } from '../../../test/admin-server';
import {
  clear as clearDb,
  createIABCategoryHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { GET_IAB_CATEGORIES } from './sample-queries.gql';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';

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
      expect(data.length).to.equal(3);

      // The parent categories should be in alphabetical order
      expect(data[0].name).to.equal('Food and Drink');
      expect(data[1].name).to.equal('Health and Wellness');
      expect(data[2].name).to.equal('Technology');

      // And so should the child categories of each parent IAB category
      // "Food and Drink"
      expect(data[0].children.length).to.equal(2);
      expect(data[0].children[0].name).to.equal('Chocolate');
      expect(data[0].children[1].name).to.equal('Pizza');

      // "Health and Wellness"
      expect(data[1].children.length).to.equal(2);
      expect(data[1].children[0].name).to.equal('Coronavirus');
      expect(data[1].children[1].name).to.equal('Fitness');

      // "Technology"
      expect(data[2].children.length).to.equal(3);
      expect(data[2].children[0].name).to.equal('Internet');
      expect(data[2].children[1].name).to.equal('Self-driving Cars');
      expect(data[2].children[2].name).to.equal('Wearables');
    });

    it('should get all available properties of IAB categories', async () => {
      const {
        data: { getIABCategories: data },
      } = await server.executeOperation({
        query: GET_IAB_CATEGORIES,
      });

      // all the props of the first parent IAB category
      expect(data[0].externalId).not.to.be.null;
      expect(data[0].name).not.to.be.null;
      expect(data[0].slug).not.to.be.null;

      // and all the props of its first child category
      expect(data[0].children[0].externalId).not.to.be.null;
      expect(data[0].children[0].name).not.to.be.null;
      expect(data[0].children[0].slug).not.to.be.null;
    });
  });
});
