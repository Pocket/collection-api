import {
  Collection,
  CollectionAuthor,
  CollectionPartner,
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

export type UpdateCollectionPartnerAssociationInput = {
  externalId: string;
} & CreateCollectionPartnerAssociationInput;

export type UpdateCollectionPartnerImageUrlInput = {
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
