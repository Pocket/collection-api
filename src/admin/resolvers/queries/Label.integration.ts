import { expect } from 'chai';
import { db } from '../../../test/admin-server';
import {
  clear as clearDb,
  createLabelHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { LABELS } from './sample-queries.gql';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';

describe('queries: Label', () => {
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

  describe('labels query', () => {
    beforeAll(async () => {
      // Create some labels
      await createLabelHelper(db, 'simon-le-bon');
      await createLabelHelper(db, 'leonard-cohen');
      await createLabelHelper(db, 'john-bon-jovi');
    });

    it('should get labels in alphabetical order', async () => {
      const {
        data: { labels: data },
      } = await server.executeOperation({
        query: LABELS,
      });

      expect(data[0].name).to.equal('john-bon-jovi');
      expect(data[1].name).to.equal('leonard-cohen');
      expect(data[2].name).to.equal('simon-le-bon');
    });

    it('should get all publicly available properties of labels', async () => {
      const {
        data: { labels: data },
      } = await server.executeOperation({
        query: LABELS,
      });

      expect(data[0].externalId).to.exist;
      expect(data[0].name).to.exist;
    });
  });
});
