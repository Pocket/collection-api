import {
  getCollection,
  getCollectionAuthor,
  getCollectionAuthors,
  getCollectionPartner,
  getCollectionPartners,
  getCollectionStory,
  getCurationCategories,
  getIABCategories,
  searchCollections,
} from './queries';
import {
  collectionImageUpload,
  createCollection,
  createCollectionAuthor,
  createCollectionPartner,
  createCollectionStory,
  deleteCollectionStory,
  updateCollection,
  updateCollectionImageUrl,
  updateCollectionAuthor,
  updateCollectionAuthorImageUrl,
  updateCollectionPartner,
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
    getCollectionStory,
    getCurationCategories,
    getIABCategories,
  },
};
