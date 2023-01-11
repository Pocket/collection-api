import { Label, PrismaClient } from '@prisma/client';
import { AdminAPIUser } from '../../admin/context';
import { UserInputError } from 'apollo-server-errors';

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
