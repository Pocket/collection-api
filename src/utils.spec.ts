import { CollectionStatus } from '@prisma/client';
import { buildGetPublishedCollectionsWhere } from './utils';
import config from './config';

describe('test utils', () => {
  describe('buildGetPublishedCollectionsWhere', () => {
    it('should filter by `en` language when no filters are provided', () => {
      const result = buildGetPublishedCollectionsWhere();

      expect(result.status).toEqual(CollectionStatus.PUBLISHED);
      expect(result.language).toEqual(config.app.defaultLanguage);
    });

    it('should add a language clause when supplied in filters', () => {
      const result = buildGetPublishedCollectionsWhere({ language: 'de' });

      expect(result.status).toEqual(CollectionStatus.PUBLISHED);
      expect(result.language).toEqual('de');
    });

    it('should add a lowercase language clause when supplied as upper case in filters', () => {
      const result = buildGetPublishedCollectionsWhere({ language: 'DE' });

      expect(result.language).toEqual('de');
    });
  });
});
