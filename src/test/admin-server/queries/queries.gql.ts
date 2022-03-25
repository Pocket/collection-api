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

export const GET_COLLECTION_PARTNERS = gql`
  query getCollectionPartners($page: Int, $perPage: Int) {
    getCollectionPartners(page: $page, perPage: $perPage) {
      partners {
        externalId
        name
        url
        imageUrl
        blurb
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

export const GET_COLLECTION_PARTNER = gql`
  query getCollectionPartner($id: String!) {
    getCollectionPartner(externalId: $id) {
      externalId
      name
      url
      imageUrl
      blurb
    }
  }
`;

export const GET_LANGUAGES = gql`
  query getLanguages {
    getLanguages
  }
`;

export const GET_CURATION_CATEGORIES = gql`
  query getCurationCategories {
    getCurationCategories {
      externalId
      name
      slug
    }
  }
`;

export const GET_IAB_CATEGORIES = gql`
  query getIABCategories {
    getIABCategories {
      externalId
      name
      slug
      children {
        externalId
        name
        slug
      }
    }
  }
`;
