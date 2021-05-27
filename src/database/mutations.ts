// provide a single file to use for imports

export {
  createCollectionAuthor,
  updateCollectionAuthor,
  updateCollectionAuthorImageUrl,
} from './mutations/CollectionAuthor';
export { createCollection, updateCollection } from './mutations/Collection';
export {
  createCollectionStory,
  deleteCollectionStory,
  updateCollectionStory,
  updateCollectionStorySortOrder,
  updateCollectionStoryImageUrl,
} from './mutations/CollectionStory';
export { createImage, associateImageWithEntity } from './mutations/Image';
