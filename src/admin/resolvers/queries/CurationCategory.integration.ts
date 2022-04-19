import { expect } from 'chai';
import { db } from '../../../test/admin-server';
import {
  clear as clearDb,
  createCurationCategoryHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { GET_CURATION_CATEGORIES } from './sample-queries.gql';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';

describe('queries: CurationCategory', () => {
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

      expect(data[0].name).to.equal('Business');
      expect(data[1].name).to.equal('Climate Change');
      expect(data[2].name).to.equal('Food and Drink');
      expect(data[3].name).to.equal('Technology');
    });

    it('should get all available properties of curation categories', async () => {
      const {
        data: { getCurationCategories: data },
      } = await server.executeOperation({
        query: GET_CURATION_CATEGORIES,
      });

      expect(data[0].externalId).to.exist;
      expect(data[0].name).to.exist;
      expect(data[0].slug).to.exist;
    });
  });
});
