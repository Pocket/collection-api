import {
  Collection,
  CollectionAuthor,
  CollectionStatus,
  CollectionStory,
  CurationCategory,
  IABCategory,
} from '@prisma/client';

export type CreateCollectionAuthorInput = {
  name: string;
  slug?: string;
  bio?: string;
  imageUrl?: string;
  active?: boolean;
};

export type UpdateCollectionAuthorInput = {
  externalId: string;
  name: string;
  slug: string;
  bio?: string;
  imageUrl?: string;
  active?: boolean;
};

export type UpdateCollectionAuthorImageUrlInput = {
  externalId: string;
  imageUrl: string;
};

export type CreateCollectionInput = {
  slug: string;
  title: string;
  excerpt?: string;
  intro?: string;
  imageUrl?: string;
  status?: CollectionStatus;
  authorExternalId: string;
  curationCategoryExternalId?: string;
  IABParentCategoryExternalId?: string;
  IABChildCategoryExternalId?: string;
};

export type UpdateCollectionInput = {
  authorExternalId: string;
  curationCategoryExternalId?: string;
  excerpt?: string;
  externalId: string;
  IABChildCategoryExternalId?: string;
  IABParentCategoryExternalId?: string;
  imageUrl?: string;
  intro?: string;
  publishedAt?: Date;
  slug: string;
  status?: CollectionStatus;
  title: string;
};

export type UpdateCollectionImageUrlInput = {
  externalId: string;
  imageUrl: string;
};

export type CollectionStoryAuthor = {
  name: string;
  sortOrder: number;
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

export type UpdateCollectionStorySortOrderInput = {
  externalId: string;
  sortOrder: number;
};

export type UpdateCollectionStoryImageUrlInput = {
  externalId: string;
  imageUrl: string;
};

export type SearchCollectionsFilters = {
  author?: string;
  title?: string;
  status?: CollectionStatus;
};

export type CollectionStoryWithAuthors = CollectionStory & {
  authors: CollectionStoryAuthor[];
};

// changes here are currently just brainstorming partnerships

// this will eventually come from @prisma/client
export enum PartnershipType {
  PARTNERED = 'PARTNERED',
  SPONSORED = 'SPONSORED',
}

export type Brand = {
  name: string;
  url: string;
  imageUrl: string;
  blurb: string;
};

export type Partnership = {
  brand: Brand;
  type: PartnershipType;
};

// this type needs to be renamed :/
// maybe CollectionFull? CollectionAll? yuck.
export type CollectionWithAuthorsAndStories = Collection & {
  authors?: CollectionAuthor[];
  curationCategory?: CurationCategory;
  IABParentCategory?: IABCategory;
  IABChildCategory?: IABCategory;
  stories?: CollectionStoryWithAuthors[];
  partnership?: Partnership;
};

export type CreateImageInput = {
  width: number;
  height: number;
  mimeType: string;
  fileSizeBytes: number;
  fileName: string;
  path: string;
};

export type IABParentCategory = IABCategory & {
  children: IABCategory[];
};
