import { expect } from 'chai';
import { faker } from '@faker-js/faker';

import { CollectionLanguage, CollectionComplete } from '../database/types';
import { sortCollectionsByGivenSlugs } from './collectionLoader';

const quickCollectionCompleteMaker = (slug: string): CollectionComplete => {
  return {
    id: faker.number.int(),
    externalId: faker.string.uuid(),
    slug,
    title: faker.lorem.words(5),
    excerpt: null,
    intro: null,
    imageUrl: null,
    language: CollectionLanguage.EN,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    curationCategoryId: null,
    IABParentCategoryId: null,
    IABChildCategoryId: null,
    status: null,
  };
};

// conjure some slugs
const slugs = [
  'lousy-smarch-weather',
  'anything-slim',
  'its-whisper-quiet',
  'whoa-canyonero',
  'you-dont-win-friends-with-salad',
];

describe('collectionLoader', () => {
  describe('sortCollectionsByGivenSlugs', () => {
    it('should sort the collections in the order of the given slugs', () => {
      // conjure some collections matching the slugs, making sure they are in a
      // different order than the slug array above
      const collections: CollectionComplete[] = [
        quickCollectionCompleteMaker('whoa-canyonero'),
        quickCollectionCompleteMaker('lousy-smarch-weather'),
        quickCollectionCompleteMaker('its-whisper-quiet'),
        quickCollectionCompleteMaker('anything-slim'),
        quickCollectionCompleteMaker('you-dont-win-friends-with-salad'),
      ];

      // they should now be sorted by the slug array
      const sorted = sortCollectionsByGivenSlugs(slugs, collections);

      for (let i = 0; i < slugs.length; i++) {
        expect(sorted[i].slug).to.equal(slugs[i]);
      }
    });

    it('should return undefined in the place of slug that was not found', () => {
      // conjure some collections matching the slugs, making sure they are in a
      // different order than the slug array above
      const collections: CollectionComplete[] = [
        quickCollectionCompleteMaker('whoa-canyonero'),
        quickCollectionCompleteMaker('lousy-smarch-weather'),
        quickCollectionCompleteMaker('anything-slim'),
        quickCollectionCompleteMaker('you-dont-win-friends-with-salad'),
      ];

      // they should now be sorted by the slug array
      const sorted = sortCollectionsByGivenSlugs(slugs, collections);

      // even though one slug wasn't found the arrays should be of equal length
      expect(sorted.length).to.equal(slugs.length);

      for (let i = 0; i < slugs.length; i++) {
        if (slugs[i] !== 'its-whisper-quiet') {
          expect(sorted[i].slug).to.equal(slugs[i]);
        } else {
          expect(sorted[i]).not.to.exist;
        }
      }
    });
  });
});
