import { CollectionStatus } from '@prisma/client';
import { buildGetPublishedCollectionsWhere } from './utils';
import config from '../config';

describe('test utils', () => {
  // TODO: figure out how to mock config
  describe('buildGetPublishedCollectionsWhere', () => {
    it('should filter by `EN` language when no filters are provided', () => {
      const result = buildGetPublishedCollectionsWhere();

      expect(result.status).toEqual(CollectionStatus.PUBLISHED);
      expect(result.language).toEqual(config.app.defaultLanguage);
    });

    it('should filter by `EN` language when an unsupported language is provided', () => {
      const result = buildGetPublishedCollectionsWhere({ language: 'xx' });

      expect(result.status).toEqual(CollectionStatus.PUBLISHED);
      expect(result.language).toEqual(config.app.defaultLanguage);
    });

    it('should add a language clause when supplied in filters', () => {
      const result = buildGetPublishedCollectionsWhere({ language: 'DE' });

      expect(result.status).toEqual(CollectionStatus.PUBLISHED);
      expect(result.language).toEqual('DE');
    });

    it('should add an uppercase language clause when supplied as lowercase in filters', () => {
      const result = buildGetPublishedCollectionsWhere({ language: 'de' });

      expect(result.status).toEqual(CollectionStatus.PUBLISHED);
      expect(result.language).toEqual('DE');
    });
  });
});
