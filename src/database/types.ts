import {
  Collection,
  CollectionAuthor,
  CollectionPartner,
  CollectionPartnership,
  CollectionPartnershipType,
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
  authorExternalId: string;
  curationCategoryExternalId?: string;
  excerpt?: string;
  IABChildCategoryExternalId?: string;
  IABParentCategoryExternalId?: string;
  imageUrl?: string;
  intro?: string;
  language: string;
  slug: string;
  status?: CollectionStatus;
  title: string;
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
  language: string;
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

export type CreateCollectionPartnerInput = {
  name: string;
  url: string;
  imageUrl: string;
  blurb: string;
};

export type UpdateCollectionPartnerInput = {
  externalId: string;
  name: string;
  url: string;
  imageUrl?: string;
  blurb: string;
};

export type CreateCollectionPartnerAssociationInput = {
  type: CollectionPartnershipType;
  partnerExternalId: string;
  collectionExternalId: string;
  name?: string;
  url?: string;
  imageUrl?: string;
  blurb?: string;
};

/**
 * We omit the collection external id from the input since, once a collection
 * to partner relationship is set up on the frontend, it won't ever be updated
 * to another collection, but it may be updated to point to another partner if
 * a mistake has been made while entering the collection details into the system.
 */
export type UpdateCollectionPartnerAssociationInput = {
  externalId: string;
} & Omit<CreateCollectionPartnerAssociationInput, 'collectionExternalId'>;

export type UpdateCollectionPartnerAssociationImageUrlInput = {
  externalId: string;
  imageUrl: string;
};

export type UpdateCollectionPartnerImageUrlInput = {
  externalId: string;
  imageUrl: string;
};

export type CollectionPartnerAssociation = Omit<
  CollectionPartnership,
  'partnerExternalId' | 'collectionExternalId'
> & {
  type: CollectionPartnershipType;
  partner: CollectionPartner;
};

export type SearchCollectionsFilters = {
  author?: string;
  title?: string;
  status?: CollectionStatus;
};

export type CollectionStoryWithAuthors = CollectionStory & {
  authors: CollectionStoryAuthor[];
};

export type CollectionComplete = Collection & {
  authors?: CollectionAuthor[];
  curationCategory?: CurationCategory;
  IABParentCategory?: IABCategory;
  IABChildCategory?: IABCategory;
  stories?: CollectionStoryWithAuthors[];
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

export type CollectionsFilters = {
  language?: string;
};
