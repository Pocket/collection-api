import config from '../../../config';
import { getServer } from '../index';
import { getServerWithMockedHeaders } from '../../helpers';
import { GET_LANGUAGES } from './queries.gql';
import {
  ACCESS_DENIED_ERROR,
  COLLECTION_CURATOR_FULL,
  READONLY,
} from '../../../shared/constants';

describe('queries: Language', () => {
  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  const server = getServerWithMockedHeaders(headers);

  beforeAll(async () => {
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('getLanguages query', () => {
    it('should get all available language codes', async () => {
      const {
        data: { getLanguages: data },
      } = await server.executeOperation({
        query: GET_LANGUAGES,
      });

      // One day this may be a database-backed query, but for now
      // all the supported languages are stored in a config variable
      data.forEach((language, index) => {
        expect(language.code).toEqual(config.app.languages[index]);
      });
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
        query: GET_LANGUAGES,
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
        query: GET_LANGUAGES,
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
        query: GET_LANGUAGES,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);

      await server.stop();
    });
  });
});
