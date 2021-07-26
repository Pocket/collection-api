import {
  getCollection,
  getCollectionAuthor,
  getCollectionAuthors,
  getCollectionPartner,
  getCollectionPartnerAssociation,
  getCollectionPartners,
  getCollectionStory,
  getCurationCategories,
  getLanguages,
  getIABCategories,
  searchCollections,
} from './queries';
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
  updateCollectionStory,
  updateCollectionStorySortOrder,
  updateCollectionStoryImageUrl,
} from './mutations';

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
    getCollectionStory,
    getCurationCategories,
    getIABCategories,
    getLanguages,
  },
};
