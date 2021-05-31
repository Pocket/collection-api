import {
  getCollection,
  getCollectionAuthor,
  getCollectionAuthors,
  getCollectionStory,
  getCurationCategories,
  searchCollections,
} from './queries';
import {
  collectionImageUpload,
  createCollection,
  createCollectionAuthor,
  createCollectionStory,
  deleteCollectionStory,
  updateCollection,
  updateCollectionAuthor,
  updateCollectionStory,
  updateCollectionStorySortOrder,
} from './mutations';

export const resolvers = {
  Mutation: {
    createCollectionAuthor,
    updateCollectionAuthor,
    createCollection,
    updateCollection,
    createCollectionStory,
    updateCollectionStory,
    deleteCollectionStory,
    collectionImageUpload,
    updateCollectionStorySortOrder,
  },
  Query: {
    getCollection,
    searchCollections,
    getCollectionAuthors,
    getCollectionAuthor,
    getCollectionStory,
    getCurationCategories,
  },
};
