import { IABParentCategory } from '../../../database/types';
import { getIABCategories as dbGetIABCategories } from '../../../database/queries';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';

export async function getIABCategories(
  parent,
  _,
  { db, authenticatedUser }
): Promise<IABParentCategory[]> {
  if (!authenticatedUser.canRead) {
    throw new Error(ACCESS_DENIED_ERROR);
  }

  return await dbGetIABCategories(db);
}