import {
  getCollection,
  getCollectionAuthor,
  getCollectionAuthors,
  getCollectionStory,
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
  },
  Query: {
    getCollection,
    searchCollections,
    getCollectionAuthors,
    getCollectionAuthor,
    getCollectionStory,
  },
};
