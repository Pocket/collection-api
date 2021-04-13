import path from 'path';
import fs from 'fs';
import { gql } from 'apollo-server';
import { CollectionWithAuthorsAndStories } from './database/queries';

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
export type CollectionsResult = {
  pagination: {
    totalResults: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  };
  collections: CollectionWithAuthorsAndStories[];
};
