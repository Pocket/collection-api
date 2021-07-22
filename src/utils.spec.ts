import { CollectionStatus } from '@prisma/client';
import { buildGetPublishedCollectionsWhere } from './utils';

describe('test utils', () => {
  describe('buildGetPublishedCollectionsWhere', () => {
    it('should only return a where with status when no filters are provided', () => {
      const result = buildGetPublishedCollectionsWhere();

      expect(result.status).toEqual(CollectionStatus.PUBLISHED);
      expect(result.language).toBeUndefined();
    });

    it('should add a language clause when supplied in filters', () => {
      const result = buildGetPublishedCollectionsWhere({ language: 'en' });

      expect(result.status).toEqual(CollectionStatus.PUBLISHED);
      expect(result.language).toEqual('en');
    });

    it('should add a lowercase language clause when supplied as upper case in filters', () => {
      const result = buildGetPublishedCollectionsWhere({ language: 'DE' });

      expect(result.language).toEqual('de');
    });
  });
});
