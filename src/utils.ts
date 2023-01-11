import { Pagination } from './typeDefs';
import { UserInputError } from '@pocket-tools/apollo-utils';

/**
 * Returns the pagination response object
 * @param totalResults
 * @param page
 * @param perPage
 */
export function getPagination(
  totalResults: number,
  page: number,
  perPage: number
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
      `At least one filter ` + properties + ` is required`
    );
  }
}
