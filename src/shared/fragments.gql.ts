import { gql } from 'apollo-server';

export const CurationCategoryData = gql`
  fragment CurationCategoryData on CurationCategory {
    externalId
    name
    slug
  }
`;

export const CollectionPartnershipData = gql`
  fragment CollectionPartnershipData on CollectionPartnership {
    externalId
    type
    name
    url
    imageUrl
    image {
      url
    }
    blurb
  }
`;

export const CollectionPartnerData = gql`
  fragment CollectionPartnerData on CollectionPartner {
    externalId
    name
    url
    imageUrl
    blurb
  }
`;

export const CollectionPartnerAssociationData = gql`
  fragment CollectionPartnerAssociationData on CollectionPartnerAssociation {
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
  ${CollectionPartnerData}
`;

export const CollectionAuthorData = gql`
  fragment CollectionAuthorData on CollectionAuthor {
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
`;

export const CollectionStoryAuthorData = gql`
  fragment CollectionStoryAuthorData on CollectionStoryAuthor {
    name
    sortOrder
  }
`;

export const CollectionStoryData = gql`
  fragment CollectionStoryData on CollectionStory {
    externalId
    url
    title
    excerpt
    imageUrl
    image {
      url
    }
    authors {
      ...CollectionStoryAuthorData
    }
    publisher
    sortOrder
    fromPartner
  }
  ${CollectionStoryAuthorData}
`;

export const IABCategoryData = gql`
  fragment IABCategoryData on IABCategory {
    externalId
    name
    slug
  }
`;

export const CollectionData = gql`
  fragment CollectionData on Collection {
    externalId
    slug
    title
    excerpt
    status
    curationCategory {
      ...CurationCategoryData
    }
    intro
    imageUrl
    image {
      url
    }
    language
    partnership {
      ...CollectionPartnershipData
    }
    publishedAt
    authors {
      ...CollectionAuthorData
    }
    stories {
      ...CollectionStoryData
    }
    IABParentCategory {
      ...IABCategoryData
    }
    IABChildCategory {
      ...IABCategoryData
    }
  }
  ${CurationCategoryData}, ${CollectionPartnershipData}, ${CollectionAuthorData}, ${CollectionStoryData}, ${IABCategoryData}
`;
