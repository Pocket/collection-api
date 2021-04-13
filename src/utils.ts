/**
 * Returns the pagination response object
 * @param totalResults
 * @param page
 * @param perPage
 */
export function getPagination(totalResults, page, perPage) {
  return {
    currentPage: page,
    totalPages: Math.ceil(totalResults / perPage),
    totalResults,
    perPage,
  };
}
