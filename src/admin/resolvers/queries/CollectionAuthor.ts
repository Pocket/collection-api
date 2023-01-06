import { countAuthors, getAuthor, getAuthors } from '../../../database/queries';
import config from '../../../config';
import { CollectionAuthorsResult } from '../../../typeDefs';
import { getPagination } from '../../../utils';
import { CollectionAuthor } from '@prisma/client';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';
import { ForbiddenError, NotFoundError } from '@pocket-tools/apollo-utils';

/**
 * @param parent
 * @param page
 * @param perPage
 * @param db
 */
export async function getCollectionAuthors(
  parent,
  { page = 1, perPage = config.app.pagination.authorsPerPage },
  { db, authenticatedUser }
): Promise<CollectionAuthorsResult> {
  if (!authenticatedUser.canRead) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }

  const totalResults = await countAuthors(db);
  const authors = await getAuthors(db, page, perPage);

  return {
    pagination: getPagination(totalResults, page, perPage),
    authors,
  };
}

/**
 * @param parent
 * @param externalId
 * @param db
 */
export async function getCollectionAuthor(
  parent,
  { externalId },
  { db, authenticatedUser }
): Promise<CollectionAuthor> {
  if (!authenticatedUser.canRead) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }

  const author = await getAuthor(db, externalId);

  if (!author) {
    throw new NotFoundError(externalId);
  }

  return author;
}
