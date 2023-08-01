import { ForbiddenError } from '@pocket-tools/apollo-utils';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';
import { getLabels } from '../../../database/queries/Label';
import { Label } from '../../../database/types';

/**
 * Retrieves all available labels.
 *
 * @param parent
 * @param _
 * @param db
 * @param authenticatedUser
 */
export async function labels(
  parent,
  _,
  { db, authenticatedUser },
): Promise<Label[]> {
  // Make sure the user has at least read-only access
  if (!authenticatedUser.canRead) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }

  return await getLabels(db);
}
