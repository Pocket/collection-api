import { gql } from 'apollo-server-express';

/**
 * Sample queries for Apollo Server integration tests as used in
 * Curation Admin Tools Frontend
 */
export const GET_COLLECTION_AUTHORS = gql`
  query getAuthors($page: Int, $perPage: Int) {
    getCollectionAuthors(page: $page, perPage: $perPage) {
      authors {
        externalId
        name
        slug
        bio
        imageUrl
        active
      }
      pagination {
        currentPage
        totalPages
        totalResults
        perPage
      }
    }
  }
`;

export const GET_COLLECTION_AUTHOR = gql`
  query getAuthor($id: String!) {
    getCollectionAuthor(externalId: $id) {
      externalId
      name
      slug
      bio
      imageUrl
      active
    }
  }
`;
