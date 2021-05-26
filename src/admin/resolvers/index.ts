import {
  getCollection,
  getCollectionAuthor,
  getCollectionAuthors,
  getCollectionStory,
  getCurationCategories,
  getIABCategories,
  searchCollections,
} from './queries';
import {
  collectionImageUpload,
  createCollection,
  createCollectionAuthor,
  createCollectionStory,
  deleteCollectionStory,
  updateCollection,
  updateCollectionImageUrl,
  updateCollectionAuthor,
  updateCollectionAuthorImageUrl,
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
    getCollectionStory,
    getCurationCategories,
    getIABCategories,
  },
};
