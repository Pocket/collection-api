import { gql } from 'apollo-server-express';
import {
  CollectionData,
  CollectionStoryData,
} from '../../../shared/fragments.gql';

/**
 * Sample queries for Apollo Server integration tests as used in
 * Curation Admin Tools Frontend
 */

export const GET_COLLECTION = gql`
  query getCollection($externalId: String!) {
    getCollection(externalId: $externalId) {
      ...CollectionData
    }
  }
  ${CollectionData}
`;

export const SEARCH_COLLECTIONS = gql`
  query searchCollections(
    $filters: SearchCollectionsFilters!
    $page: Int
    $perPage: Int
  ) {
    searchCollections(filters: $filters, page: $page, perPage: $perPage) {
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

export const GET_COLLECTION_STORY = gql`
  query getCollectionStory($externalId: String!) {
    getCollectionStory(externalId: $externalId) {
      ...CollectionStoryData
    }
  }
  ${CollectionStoryData}
`;
