import { expect } from 'chai';
import { db } from '../../../test/admin-server';
import {
  clear as clearDb,
  createLabelHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { CREATE_LABEL } from './sample-mutations.gql';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';

describe('mutations: Label', () => {
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

  describe('createLabel', () => {
    beforeAll(async () => {
      // Create some labels
      await createLabelHelper(db, 'simon-le-bon');
    });

    it('should create a new label', async () => {
      const { data } = await server.executeOperation({
        query: CREATE_LABEL,
        variables: { name: 'katerina-ch-1' },
      });
      expect(data.createLabel.name).to.equal('katerina-ch-1');
    });

    it('should not create label that already exists', async () => {
      const data = await server.executeOperation({
        query: CREATE_LABEL,
        variables: { name: 'simon-le-bon' },
      });
      expect(data.errors.length).to.equal(1);
      expect(data.errors[0].message).to.equal(
        `A label with the name "simon-le-bon" already exists`
      );
    });
  });
});
