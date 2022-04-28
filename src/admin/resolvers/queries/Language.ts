import { ForbiddenError } from 'apollo-server-errors';
import { CollectionLanguage } from '../../../database/types';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';

/**
 *
 * @param parent
 * @param _ (empty because this takes no params)
 * @param db
 */
export function getLanguages(parent, _, { db, authenticatedUser }): any {
  if (!authenticatedUser.canRead) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }

  return Object.values(CollectionLanguage);
}
