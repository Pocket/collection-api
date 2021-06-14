// provide a single file to use for imports

export {
  countAuthors,
  getAuthor,
  getAuthors,
} from './queries/CollectionAuthor';
export {
  countPublishedCollections,
  getCollection,
  getCollectionBySlug,
  getCollectionsBySlugs,
  getPublishedCollections,
  searchCollections,
} from './queries/Collection';
export { getCollectionStory } from './queries/CollectionStory';
export { getCurationCategories } from './queries/CurationCategory';
export { getIABCategories } from './queries/IABCategory';
