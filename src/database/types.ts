import {
  Collection,
  CollectionAuthor,
  CollectionStatus,
  CollectionStory,
} from '@prisma/client';

export type CreateCollectionAuthorInput = {
  name: string;
  slug?: string;
  bio?: string;
  imageUrl?: string;
};

export type UpdateCollectionAuthorInput = {
  externalId: string;
  name: string;
  slug: string;
  bio?: string;
  imageUrl?: string;
  active?: boolean;
};

export type CreateCollectionInput = {
  slug: string;
  title: string;
  excerpt?: string;
  intro?: string;
  imageUrl?: string;
  status?: CollectionStatus;
  authorExternalId: string;
};

export type UpdateCollectionInput = {
  externalId: string;
  slug: string;
  title: string;
  excerpt?: string;
  intro?: string;
  imageUrl?: string;
  status?: CollectionStatus;
  authorExternalId: string;
  publishedAt?: Date;
};

export type CollectionStoryAuthor = {
  name: string;
};

export type CreateCollectionStoryInput = {
  collectionExternalId: string;
  url: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  authors: CollectionStoryAuthor[];
  publisher: string;
  sortOrder?: number;
};

export type UpdateCollectionStoryInput = Omit<
  CreateCollectionStoryInput,
  'collectionExternalId'
> & {
  externalId: string;
};

export type SearchCollectionsFilters = {
  author?: string;
  title?: string;
  status?: CollectionStatus;
};

export type CollectionWithAuthorsAndStories = Collection & {
  authors?: CollectionAuthor[];
  stories?: CollectionStory[];
};

export type CreateImageInput = {
  width: number;
  height: number;
  mimeType: string;
  fileSizeBytes: number;
  fileName: string;
  path: string;
};
