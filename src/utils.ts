import { Pagination } from './typeDefs';
import { UserInputError } from '@pocket-tools/apollo-utils';
import { CollectionLanguage } from './database/types';

/**
 * Returns the pagination response object
 * @param totalResults
 * @param page
 * @param perPage
 */
export function getPagination(
  totalResults: number,
  page: number,
  perPage: number,
): Pagination {
  return {
    currentPage: page,
    totalPages: Math.ceil(totalResults / perPage),
    totalResults,
    perPage,
  };
}

/**
 * validates if at least one filter is present
 * @param filters
 * @param properties
 */
export function collectionFilterValidation(filters: any, properties: string) {
  if (!Object.keys(filters).length) {
    throw new UserInputError(
      `At least one filter ` + properties + ` is required`,
    );
  }
}

/**
 * Determines if a url is a valid collection url and returns its slug.
 * Returns null for invalid collection urls
 * @param url
 * @returns A collection's slug or null
 */
export const getCollectionUrlSlug = (url: string): string | null => {
  // get a string of allowed languages in this format "en|de|..."
  const allowedLanguages = Object.values(CollectionLanguage).join('|');

  const regExpString = `^https?://(?:getpocket.com)(?:/(?:${allowedLanguages}))?/collections/(.*)`;

  // create a regular expression from the string above and make it case-insensitive
  const validCollectionUrlRegExp = new RegExp(regExpString, 'i');

  const match = validCollectionUrlRegExp.exec(url);
  if (!match) {
    return null;
  }

  // return the slug that is captured as the second match group from the regex
  return match[1];
};
