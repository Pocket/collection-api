import path from 'path';
import fs from 'fs';
import { gql } from 'apollo-server';

import { CollectionAuthor, CurationCategory } from '@prisma/client';
import { CollectionWithAuthorsAndStories } from './database/types';

const sharedSchema = fs
  .readFileSync(path.join(__dirname, '..', 'schema-shared.graphql'))
  .toString();

export const typeDefsPublic = gql(
  fs
    .readFileSync(path.join(__dirname, '..', 'schema-public.graphql'))
    .toString()
    .concat(sharedSchema)
);

export const typeDefsAdmin = gql(
  fs
    .readFileSync(path.join(__dirname, '..', 'schema-admin.graphql'))
    .toString()
    .concat(sharedSchema)
);

/**
 * The shape of the response for searchCollections and getCollections queries
 */
export type Pagination = {
  totalResults: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
};

export type CollectionsResult = {
  pagination: Pagination;
  collections: CollectionWithAuthorsAndStories[];
};

export type CollectionAuthorsResult = {
  pagination: Pagination;
  authors: CollectionAuthor[];
};

export type CurationCategoriesResult = {
  pagination: Pagination;
  curationCategories: CurationCategory[];
};
