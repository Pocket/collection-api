import { gql } from 'apollo-server-express';
import { CollectionData } from '../../../shared/fragments.gql';

/**
 * Sample queries for Apollo Server integration tests as used in
 * Curation Admin Tools Frontend
 */

export const GET_COLLECTIONS = gql`
  query getCollections(
    $page: Int
    $perPage: Int
    $filters: CollectionsFiltersInput
  ) {
    getCollections(page: $page, perPage: $perPage, filters: $filters) {
      collections {
        ...CollectionData
      }
      pagination {
        currentPage
        totalPages
        totalResults
        perPage
      }
    }
  }
  ${CollectionData}
`;

export const GET_COLLECTION_BY_SLUG = gql`
  query getCollectionBySlug($slug: String!) {
    getCollectionBySlug(slug: $slug) {
      ...CollectionData
    }
  }
  ${CollectionData}
`;

export const COLLECTION_BY_SLUG = gql`
  query collectionBySlug($slug: String!) {
    collectionBySlug(slug: $slug) {
      ...CollectionData
    }
  }
  ${CollectionData}
`;
