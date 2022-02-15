import config from '../../../config';
import { getServer } from '../';
import { GET_LANGUAGES } from './queries.gql';

describe('queries: Language', () => {
  const server = getServer();

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
  });
});
