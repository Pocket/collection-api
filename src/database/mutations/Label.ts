import { Label, PrismaClient } from '@prisma/client';
import { AdminAPIUser } from '../../admin/context';
import { UserInputError } from '@pocket-tools/apollo-utils';
import { UpdateLabelInput } from '../types';

/**
 * @param db
 * @param name
 * @param authenticatedUser
 */
export async function createLabel(
  db: PrismaClient,
  name: string,
  authenticatedUser: AdminAPIUser
): Promise<Label> {
  // check if label with updated name already exists
  const labelNameCount = await db.label.count({
    where: {
      name: name,
    },
  });
  if (labelNameCount > 0) {
    throw new UserInputError(`A label with the name "${name}" already exists`);
  }

  return db.label.create({
    data: { name: name, createdBy: authenticatedUser.username },
  });
}

/**
 * @param db
 * @param data
 * @param authenticatedUser
 */
export async function updateLabel(
  db: PrismaClient,
  data: UpdateLabelInput,
  authenticatedUser: AdminAPIUser
): Promise<Label> {
  // get count for collection-label association for label to update
  const collectionLabelAssociationCount = await db.collection.count({
    where: {
      labels: {
        some: { label: { externalId: data.externalId } },
      },
    },
  });

  // if there is at least one collection-label association, don't allow update
  if (collectionLabelAssociationCount > 0) {
    throw new UserInputError(
      `Cannot update label; it is associated with at least one collection`
    );
  }
  // check if label with updated name already exists
  const labelNameCount = await db.label.count({
    where: {
      name: data.name,
    },
  });
  if (labelNameCount > 0) {
    throw new UserInputError(
      `A label with the name "${data.name}" already exists`
    );
  }

  return db.label.update({
    where: { externalId: data.externalId },
    data: { name: data.name, updatedBy: authenticatedUser.username },
  });
}
