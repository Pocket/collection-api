import { Pagination } from './typeDefs';

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
