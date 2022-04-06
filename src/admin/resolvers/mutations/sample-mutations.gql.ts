import { gql } from 'apollo-server-express';
import { CollectionData } from '../../../shared/fragments.gql';

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
