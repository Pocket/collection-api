import { CollectionStatus } from '@prisma/client';
import {
  buildGetPublishedCollectionsWhere,
  buildSearchCollectionsWhereClause,
} from './utils';
import config from '../config';
import { v4 as uuidv4 } from 'uuid';

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

  describe('buildSearchCollectionsWhereClause', () => {
    it('should filter by author when author provided', () => {
      const result = buildSearchCollectionsWhereClause({ author: 'katerina' });

      expect(result.authors).toEqual({
        every: { name: { contains: 'katerina' } },
      });
    });

    it('should filter by status when status provided', () => {
      const result = buildSearchCollectionsWhereClause({ status: 'DRAFT' });

      expect(result.status).toEqual('DRAFT');
    });

    it('should filter by title when title provided', () => {
      const result = buildSearchCollectionsWhereClause({
        title: 'sample title',
      });

      expect(result.title).toEqual({ contains: 'sample title' });
    });

    it('should filter by labelExternalIds when labelExternalIds provided', () => {
      const id1 = uuidv4();
      const id2 = uuidv4();
      const result = buildSearchCollectionsWhereClause({
        labelExternalIds: [id1, id2],
      });

      expect(result.labels).toEqual({
        some: { label: { externalId: { in: [id1, id2] } } },
      });
    });
  });
});
