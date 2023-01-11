import path from 'path';
import fs from 'fs';
import { gql } from 'apollo-server-express';

import { CollectionAuthor, CollectionPartner } from '@prisma/client';
import { CollectionComplete } from './database/types';

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
  collections: CollectionComplete[];
};

export type CollectionAuthorsResult = {
  pagination: Pagination;
  authors: CollectionAuthor[];
};

export type CollectionPartnersResult = {
  pagination: Pagination;
  partners: CollectionPartner[];
};
