import { ForbiddenError } from 'apollo-server-errors';
import { getCurationCategories as dbGetCurationCategories } from '../../../database/queries';
import { CurationCategory } from '@prisma/client';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';

/**
 * @param parent
 * @param db
 */
export async function getCurationCategories(
  parent,
  _,
  { db, authenticatedUser }
): Promise<CurationCategory[]> {
  if (!authenticatedUser.canRead) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }

  return await dbGetCurationCategories(db);
}
