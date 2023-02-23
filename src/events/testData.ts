import { CollectionPartnershipType } from '@prisma/client';
import { CollectionComplete } from '../database/types';

export const now = new Date('2023-01-01 00:00:00 GMT-5');

export const testAuthor = {
  id: 0,
  externalId: 'test-author-id',
  name: 'test-author-name',
  slug: 'test-author-slug',
  bio: 'test-author-bio',
  imageUrl: 'test-author-image-url',
  createdAt: now,
  updatedAt: now,
  active: true,
};

export const testStory = {
  id: 0,
  externalId: 'test-story-id',
  collectionId: 1,
  url: 'test-story-url',
  title: 'test-story-title',
  excerpt: 'test-story-excerpt',
  imageUrl: 'test-story-image-url',
  publisher: 'test-story-publisher',
  sortOrder: 1,
  createdAt: now,
  updatedAt: now,
  fromPartner: true,
  authors: [{ name: 'test-story-author', sortOrder: 1 }],
};

export const testCurationCategory = {
  id: 0,
  externalId: 'test-curation-category-id',
  slug: 'test-slug',
  name: 'test-name',
};

export const testPartnership = {
  externalId: 'test-external-id',
  type: CollectionPartnershipType.PARTNERED,
  name: 'test-name',
  url: 'test-url',
  imageUrl: 'test-image-url',
  blurb: 'test-blurb',
};

export const testIABCategory = {
  id: 0,
  externalId: 'test-external-id',
  name: 'test-name',
  slug: 'test-slug',
  createdAt: now,
  updatedAt: now,
  IABCategoryId: 1,
};

export const testLabels = [
  { externalId: 'id-one', name: 'label-one' },
  { externalId: 'id-two', name: 'label-two' },
];

export const testCollectionLabel = [
  {
    labelId: 1,
    collectionId: 1,
    createdAt: now,
    createdBy: 'test-collection-label-created-by',
  },
  {
    labelId: 2,
    collectionId: 1,
    createdAt: now,
    createdBy: 'test-collection-label-created-by-2',
  },
];

export const testCollection: CollectionComplete = {
  id: 0,
  externalId: 'test-collection-externalId',
  slug: 'test-collection-slug',
  title: 'test-collection-title',
  language: 'EN',
  createdAt: now,
  updatedAt: now,
  publishedAt: now,
  status: 'PUBLISHED',
  labels: testCollectionLabel,
  curationCategoryId: null,
  excerpt: null,
  IABChildCategoryId: null,
  IABParentCategoryId: null,
  imageUrl: null,
  intro: null,
};
