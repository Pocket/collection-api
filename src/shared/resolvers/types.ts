import { CollectionPartner, CollectionPartnership } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
/**
 * Field-level resolvers for the public CollectionPartnership type.
 *
 * Even though it appears that we're querying the partner up to four times
 * to retrieve the information for the four fields below, Prisma is actually
 * batching the queries behind the scenes and there is no performance hit.
 */
export const collectionPartnershipFieldResolvers = {
  async name(parent: CollectionPartnership, _, { db }): Promise<string> {
    if (parent.name) {
      return parent.name;
    } else {
      const partner = await getPartnerById(db, parent.partnerId);
      return partner.name;
    }
  },

  async url(parent: CollectionPartnership, _, { db }): Promise<string> {
    if (parent.url) {
      return parent.url;
    } else {
      const partner = await getPartnerById(db, parent.partnerId);
      return partner.url;
    }
  },

  async imageUrl(parent: CollectionPartnership, _, { db }): Promise<string> {
    if (parent.imageUrl) {
      return parent.imageUrl;
    } else {
      const partner = await getPartnerById(db, parent.partnerId);
      return partner.imageUrl;
    }
  },

  async image(
    parent: CollectionPartnership,
    _,
    { db }
  ): Promise<{ url: string }> {
    if (parent.imageUrl) {
      return { url: parent.imageUrl };
    } else {
      const partner = await getPartnerById(db, parent.partnerId);
      return { url: partner.imageUrl };
    }
  },

  async blurb(parent: CollectionPartnership, _, { db }): Promise<string> {
    if (parent.blurb) {
      return parent.blurb;
    } else {
      const partner = await getPartnerById(db, parent.partnerId);
      return partner.blurb;
    }
  },
};

/**
 * Look up the collection partner via its primary key.
 *
 * @param db
 * @param id
 */
const getPartnerById = async (
  db: PrismaClient,
  id: number
): Promise<CollectionPartner> => {
  return await db.collectionPartner.findUnique({
    where: { id },
  });
};
