import { CollectionStoryAuthor } from '../database/types';
import { sortCollectionStoryAuthors, getCollectionUrlSlug } from './helpers';

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
  describe('getCollectionUrlSlug', () => {
    it('should return the slug for valid collection url ', () => {
      const enCollection =
        'https://getpocket.com/collections/multiverse-reader';

      const deCollection =
        'https://getpocket.com/de/collections/cybersicherheit-kurz-und-bundig';

      expect(getCollectionUrlSlug(enCollection)).toEqual('multiverse-reader');
      expect(getCollectionUrlSlug(deCollection)).toEqual(
        'cybersicherheit-kurz-und-bundig'
      );
    });

    it('should return null for invalid collection urls ', () => {
      const invalidCollection = 'https://getpocket.com/multiverse-reader';

      //unsupported collection language
      const frCollection =
        'https://getpocket.com/fr/collections/cybersicherheit-kurz-und-bundig';

      expect(getCollectionUrlSlug(invalidCollection)).toBeNull;
      expect(getCollectionUrlSlug(frCollection)).toBeNull;
    });
  });
});
