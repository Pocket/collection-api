import { expect } from 'chai';
import { getServerWithMockedHeaders } from '../../../test/helpers';
import { GET_LANGUAGES } from './sample-queries.gql';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import { CollectionLanguage } from '../../../database/types';

describe('queries: Language', () => {
  describe('getLanguages query', () => {
    it('should get all available languages', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const {
        data: { getLanguages: data },
      } = await server.executeOperation({
        query: GET_LANGUAGES,
      });

      expect(data.length).to.equal(Object.values(CollectionLanguage).length);

      data.forEach((language) => {
        expect(language in CollectionLanguage).to.be.true;
      });
    });
  });
});
