import { gql } from 'graphql-tag';
import {
  CollectionAuthorData,
  CollectionData,
  CollectionPartnerData,
  CollectionPartnerAssociationData,
  CollectionStoryData,
} from '../../../shared/fragments.gql';

export const CREATE_COLLECTION = gql`
  mutation createCollection($data: CreateCollectionInput!) {
    createCollection(data: $data) {
      ...CollectionData
    }
  }
  ${CollectionData}
`;

export const UPDATE_COLLECTION = gql`
  mutation updateCollection($data: UpdateCollectionInput!) {
    updateCollection(data: $data) {
      ...CollectionData
    }
  }
  ${CollectionData}
`;

export const UPDATE_COLLECTION_IMAGE_URL = gql`
  mutation updateCollectionImageUrl($data: UpdateCollectionImageUrlInput!) {
    updateCollectionImageUrl(data: $data) {
      ...CollectionData
    }
  }
  ${CollectionData}
`;

export const CREATE_COLLECTION_AUTHOR = gql`
  mutation createCollectionAuthor($data: CreateCollectionAuthorInput!) {
    createCollectionAuthor(data: $data) {
      ...CollectionAuthorData
    }
  }
  ${CollectionAuthorData}
`;

export const UPDATE_COLLECTION_AUTHOR = gql`
  mutation updateCollectionAuthor($data: UpdateCollectionAuthorInput!) {
    updateCollectionAuthor(data: $data) {
      ...CollectionAuthorData
    }
  }
  ${CollectionAuthorData}
`;

export const UPDATE_COLLECTION_AUTHOR_IMAGE_URL = gql`
  mutation updateCollectionAuthorImageUrl(
    $data: UpdateCollectionAuthorImageUrlInput!
  ) {
    updateCollectionAuthorImageUrl(data: $data) {
      ...CollectionAuthorData
    }
  }
  ${CollectionAuthorData}
`;

export const CREATE_COLLECTION_PARTNER = gql`
  mutation createCollectionPartner($data: CreateCollectionPartnerInput!) {
    createCollectionPartner(data: $data) {
      ...CollectionPartnerData
    }
  }
  ${CollectionPartnerData}
`;

export const UPDATE_COLLECTION_PARTNER = gql`
  mutation updateCollectionPartner($data: UpdateCollectionPartnerInput!) {
    updateCollectionPartner(data: $data) {
      ...CollectionPartnerData
    }
  }
  ${CollectionPartnerData}
`;

export const UPDATE_COLLECTION_PARTNER_IMAGE_URL = gql`
  mutation updateCollectionPartnerImageUrl(
    $data: UpdateCollectionPartnerImageUrlInput!
  ) {
    updateCollectionPartnerImageUrl(data: $data) {
      ...CollectionPartnerData
    }
  }
  ${CollectionPartnerData}
`;

export const CREATE_COLLECTION_PARTNER_ASSOCIATION = gql`
  mutation createCollectionPartnerAssociation(
    $data: CreateCollectionPartnerAssociationInput!
  ) {
    createCollectionPartnerAssociation(data: $data) {
      ...CollectionPartnerAssociationData
    }
  }
  ${CollectionPartnerAssociationData}
`;

export const UPDATE_COLLECTION_PARTNER_ASSOCIATION = gql`
  mutation updateCollectionPartnerAssociation(
    $data: UpdateCollectionPartnerAssociationInput!
  ) {
    updateCollectionPartnerAssociation(data: $data) {
      ...CollectionPartnerAssociationData
    }
  }
  ${CollectionPartnerAssociationData}
`;

export const UPDATE_COLLECTION_PARTNER_ASSOCIATION_IMAGE_URL = gql`
  mutation updateCollectionPartnerAssociationImageUrl(
    $data: UpdateCollectionPartnerAssociationImageUrlInput!
  ) {
    updateCollectionPartnerAssociationImageUrl(data: $data) {
      ...CollectionPartnerAssociationData
    }
  }
  ${CollectionPartnerAssociationData}
`;

export const DELETE_COLLECTION_PARTNER_ASSOCIATION = gql`
  mutation deleteCollectionPartnerAssociation($externalId: String!) {
    deleteCollectionPartnerAssociation(externalId: $externalId) {
      ...CollectionPartnerAssociationData
    }
  }
  ${CollectionPartnerAssociationData}
`;

export const CREATE_COLLECTION_STORY = gql`
  mutation createCollectionStory($data: CreateCollectionStoryInput!) {
    createCollectionStory(data: $data) {
      ...CollectionStoryData
    }
  }
  ${CollectionStoryData}
`;

export const UPDATE_COLLECTION_STORY = gql`
  mutation updateCollectionStory($data: UpdateCollectionStoryInput!) {
    updateCollectionStory(data: $data) {
      ...CollectionStoryData
    }
  }
  ${CollectionStoryData}
`;

export const UPDATE_COLLECTION_STORY_SORT_ORDER = gql`
  mutation updateCollectionStorySortOrder(
    $data: UpdateCollectionStorySortOrderInput!
  ) {
    updateCollectionStorySortOrder(data: $data) {
      ...CollectionStoryData
    }
  }
  ${CollectionStoryData}
`;

export const UPDATE_COLLECTION_STORY_IMAGE_URL = gql`
  mutation updateCollectionStoryImageUrl(
    $data: UpdateCollectionStoryImageUrlInput!
  ) {
    updateCollectionStoryImageUrl(data: $data) {
      ...CollectionStoryData
    }
  }
  ${CollectionStoryData}
`;

export const DELETE_COLLECTION_STORY = gql`
  mutation deleteCollectionStory($externalId: String!) {
    deleteCollectionStory(externalId: $externalId) {
      ...CollectionStoryData
    }
  }
  ${CollectionStoryData}
`;

export const CREATE_LABEL = gql`
  mutation createLabel($name: String!) {
    createLabel(name: $name) {
      name
      externalId
    }
  }
`;

export const UPDATE_LABEL = gql`
  mutation updateLabel($data: UpdateLabelInput!) {
    updateLabel(data: $data) {
      name
      externalId
    }
  }
`;
