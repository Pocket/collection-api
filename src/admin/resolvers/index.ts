import { getCollection, searchCollections } from './queries/Collection';
import { getCollectionStory } from './queries/CollectionStory';
import {
  getCollectionAuthor,
  getCollectionAuthors,
} from './queries/CollectionAuthor';
import {
  getCollectionPartner,
  getCollectionPartnerAssociation,
  getCollectionPartners,
  getCollectionPartnerAssociationForCollection,
} from './queries/CollectionPartner';
import { getCurationCategories } from './queries/CurationCategory';
import { getIABCategories } from './queries/IABCategory';
import { getLanguages } from './queries/Language';
import {
  collectionImageUpload,
  createCollection,
  createCollectionAuthor,
  createCollectionPartner,
  createCollectionPartnerAssociation,
  createCollectionStory,
  deleteCollectionPartnerAssociation,
  deleteCollectionStory,
  updateCollection,
  updateCollectionImageUrl,
  updateCollectionAuthor,
  updateCollectionAuthorImageUrl,
  updateCollectionPartner,
  updateCollectionPartnerImageUrl,
  updateCollectionPartnerAssociation,
  updateCollectionPartnerAssociationImageUrl,
  updateCollectionStory,
  updateCollectionStorySortOrder,
  updateCollectionStoryImageUrl,
} from './mutations';
import {
  collectionPartnershipFieldResolvers,
  Image,
} from '../../shared/resolvers/types';
import {
  Collection,
  CollectionAuthor,
  CollectionPartner,
  CollectionStory,
} from '@prisma/client';
import { CollectionPartnerAssociation } from '../../database/types';

export const resolvers = {
  Mutation: {
    createCollectionAuthor,
    updateCollectionAuthor,
    updateCollectionAuthorImageUrl,
    createCollection,
    updateCollection,
    updateCollectionImageUrl,
    createCollectionPartner,
    updateCollectionPartner,
    updateCollectionPartnerImageUrl,
    createCollectionPartnerAssociation,
    updateCollectionPartnerAssociation,
    updateCollectionPartnerAssociationImageUrl,
    deleteCollectionPartnerAssociation,
    createCollectionStory,
    updateCollectionStory,
    deleteCollectionStory,
    collectionImageUpload,
    updateCollectionStorySortOrder,
    updateCollectionStoryImageUrl,
  },
  Query: {
    getCollection,
    searchCollections,
    getCollectionAuthors,
    getCollectionAuthor,
    getCollectionPartner,
    getCollectionPartners,
    getCollectionPartnerAssociation,
    getCollectionPartnerAssociationForCollection,
    getCollectionStory,
    getCurationCategories,
    getIABCategories,
    getLanguages,
  },
  CollectionPartnership: collectionPartnershipFieldResolvers,
  Collection: {
    async image(parent: Collection, _, { db }): Promise<Image> {
      return { url: parent.imageUrl };
    },
  },
  CollectionStory: {
    async image(parent: CollectionStory, _, { db }): Promise<Image> {
      return { url: parent.imageUrl };
    },
  },
  CollectionAuthor: {
    async image(parent: CollectionAuthor, _, { db }): Promise<Image> {
      return { url: parent.imageUrl };
    },
  },
  CollectionPartnerAssociation: {
    async image(
      parent: CollectionPartnerAssociation,
      _,
      { db }
    ): Promise<Image> {
      return { url: parent.imageUrl };
    },
  },
  CollectionPartner: {
    async image(parent: CollectionPartner, _, { db }): Promise<Image> {
      return { url: parent.imageUrl };
    },
  },
};
