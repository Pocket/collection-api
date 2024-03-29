import { ForbiddenError } from '@pocket-tools/apollo-utils';
import { CollectionLanguage } from '../../../database/types';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';

/**
 *
 * @param parent
 * @param _ (empty because this takes no params)
 * @param db
 * @param authenticatedUser
 */
export function getLanguages(parent, _, { db, authenticatedUser }): any {
  if (!authenticatedUser.canRead) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }

  return Object.values(CollectionLanguage);
}
