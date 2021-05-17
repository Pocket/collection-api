import { CollectionStoryAuthor } from '../database/types';
import { sortCollectionStoryAuthors } from './helpers';

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
});
