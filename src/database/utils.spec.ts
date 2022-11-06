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

    it('should add a label clause when supplied in filters', () => {
      const result = buildGetPublishedCollectionsWhere({
        labels: ['test-label'],
      });

      const labelWhereClause = {
        some: { label: { name: { in: ['test-label'] } } },
      };

      expect(result.status).toEqual(CollectionStatus.PUBLISHED);
      // language should be defaulted to EN when no language
      expect(result.language).toEqual('EN');
      expect(result.labels).toMatchObject(labelWhereClause);
    });
  });
});
