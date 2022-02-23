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
