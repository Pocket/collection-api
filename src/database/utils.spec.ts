import { CollectionStatus } from '@prisma/client';
import {
  buildGetPublishedCollectionsWhere,
  isSupportedLanguage,
} from './utils';
import config from '../config';

describe('test utils', () => {
  // TODO: figure out how to mock config
  describe('buildGetPublishedCollectionsWhere', () => {
    it('should filter by `en` language when no filters are provided', () => {
      const result = buildGetPublishedCollectionsWhere();

      expect(result.status).toEqual(CollectionStatus.PUBLISHED);
      expect(result.language).toEqual(config.app.defaultLanguage);
    });

    it('should filter by `en` language when an unsupported language is provided', () => {
      const result = buildGetPublishedCollectionsWhere({ language: 'xx' });

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

      expect(result.status).toEqual(CollectionStatus.PUBLISHED);
      expect(result.language).toEqual('de');
    });
  });

  describe('isSupportedLanguage', () => {
    it('should return true given a supported language', () => {
      expect(isSupportedLanguage('en')).toBeTruthy();
    });

    it('should return false given a supported language', () => {
      expect(isSupportedLanguage('xx')).toBeFalsy();
    });

    it('should return false given a supported language in uppercase', () => {
      expect(isSupportedLanguage('EN')).toBeFalsy();
    });
  });
});
