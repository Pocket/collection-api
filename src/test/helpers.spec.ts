import { CollectionStoryAuthor } from '../database/types';
import { sortCollectionStoryAuthors, isValidCollectionUrl } from './helpers';

describe('test helpers', () => {
  describe('sortCollectionStoryAuthors', () => {
    it('should sort authors by the sortOrder property', () => {
      const authors: CollectionStoryAuthor[] = [
        {
          name: 'the dude',
          sortOrder: 2,
        },
        {
          name: 'walter',
          sortOrder: 1,
        },
        {
          name: 'donny',
          sortOrder: 0,
        },
      ];

      const sorted = sortCollectionStoryAuthors(authors);

      expect(sorted[0].name).toEqual('donny');
      expect(sorted[1].name).toEqual('walter');
      expect(sorted[2].name).toEqual('the dude');
    });
  });
  describe('isValidCollectionUrl', () => {
    it('should return true for valid collection urls ', () => {
      const enCollection =
        'https://getpocket.com/collections/multiverse-reader';

      const deCollection =
        'https://getpocket.com/de/collections/cybersicherheit-kurz-und-bundig';

      expect(isValidCollectionUrl(enCollection)).toEqual(true);
      expect(isValidCollectionUrl(deCollection)).toEqual(true);
    });

    it('should return false for invalid collection urls ', () => {
      const invalidCollection = 'https://getpocket.com/multiverse-reader';

      const frCollection =
        'https://getpocket.com/fr/collections/cybersicherheit-kurz-und-bundig';

      expect(isValidCollectionUrl(invalidCollection)).toEqual(false);
      expect(isValidCollectionUrl(frCollection)).toEqual(false);
    });
  });
});
