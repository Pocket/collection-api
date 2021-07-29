// provide a single file to use for imports

export {
  createCollectionAuthor,
  updateCollectionAuthor,
  updateCollectionAuthorImageUrl,
} from './mutations/CollectionAuthor';
export {
  createCollection,
  updateCollection,
  updateCollectionImageUrl,
} from './mutations/Collection';
export {
  createCollectionPartner,
  updateCollectionPartner,
  updateCollectionPartnerImageUrl,
} from './mutations/CollectionPartner';
export {
  createCollectionPartnerAssociation,
  updateCollectionPartnerAssociation,
  updateCollectionPartnerAssociationImageUrl,
  deleteCollectionPartnerAssociation,
} from './mutations/CollectionPartnerAssociation';
export {
  createCollectionStory,
  deleteCollectionStory,
  updateCollectionStory,
  updateCollectionStorySortOrder,
  updateCollectionStoryImageUrl,
} from './mutations/CollectionStory';
export { createImage, associateImageWithEntity } from './mutations/Image';
