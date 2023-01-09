import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';

import { GET_LANGUAGES } from './sample-queries.gql';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import { CollectionLanguage } from '../../../database/types';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';

describe('queries: Language', () => {
  let app: Express.Application;
  let server: ApolloServer<IAdminContext>;
  let graphQLUrl: string;

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, adminServer: server, adminUrl: graphQLUrl } = await startServer(0));
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('getLanguages query', () => {
    it('should get all available languages', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(GET_LANGUAGES) });
      const data = result.body.data.getLanguages;

      expect(data.length).to.equal(Object.values(CollectionLanguage).length);

      data.forEach((language) => {
        expect(language in CollectionLanguage).to.be.true;
      });
    });
  });
});
