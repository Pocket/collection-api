import { gql } from 'apollo-server-express';
import {
  CollectionData,
  CollectionPartnerData,
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

export const GET_COLLECTION_AUTHORS = gql`
  query getAuthors($page: Int, $perPage: Int) {
    getCollectionAuthors(page: $page, perPage: $perPage) {
      authors {
        externalId
        name
        slug
        bio
        imageUrl
        image {
          url
        }
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
      image {
        url
      }
      active
    }
  }
`;

export const GET_COLLECTION_PARTNERS = gql`
  query getCollectionPartners($page: Int, $perPage: Int) {
    getCollectionPartners(page: $page, perPage: $perPage) {
      partners {
        ...CollectionPartnerData
      }
      pagination {
        currentPage
        totalPages
        totalResults
        perPage
      }
    }
  }
  ${CollectionPartnerData}
`;

export const GET_COLLECTION_PARTNER = gql`
  query getCollectionPartner($id: String!) {
    getCollectionPartner(externalId: $id) {
      externalId
      name
      url
      imageUrl
      image {
        url
      }
      blurb
    }
  }
`;

export const GET_COLLECTION_PARTNER_ASSOCIATION = gql`
  query getCollectionPartnerAssociation($externalId: String!) {
    getCollectionPartnerAssociation(externalId: $externalId) {
      externalId
      type
      partner {
        ...CollectionPartnerData
      }
      name
      url
      imageUrl
      image {
        url
      }
      blurb
    }
  }
  ${CollectionPartnerData}
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

export const GET_LANGUAGES = gql`
  query getLanguages {
    getLanguages
  }
`;
