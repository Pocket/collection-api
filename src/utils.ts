/**
 * Returns the pagination response object
 * @param totalResults
 * @param page
 * @param perPage
 */
import { Pagination } from './typeDefs';

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
