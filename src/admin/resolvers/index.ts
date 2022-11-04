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
  collectionLabelsFieldResolvers,
  collectionPartnershipFieldResolvers,
} from '../../shared/resolvers/types';
import { labels } from './queries/Label';

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
    labels,
  },
  CollectionPartnership: collectionPartnershipFieldResolvers,
  Label: collectionLabelsFieldResolvers,
};
