import { CollectionPartnership as PrismaCollectionPartnership } from '@prisma/client';

/**
 * Field-level resolvers for the public CollectionPartnership type.
 *
 * Even though it appears that we're querying the partner up to four times
 * to retrieve the information for the four fields below, Prisma is actually
 * batching the queries behind the scenes and there is no performance hit.
 */
export const collectionPartnershipFieldResolvers = {
  async name(parent: PrismaCollectionPartnership, _, { db }): Promise<string> {
    if (parent.name) {
      return parent.name;
    } else {
      const partner = await db.collectionPartner.findUnique({
        where: { id: parent.partnerId },
      });
      return partner.name;
    }
  },

  async url(parent: PrismaCollectionPartnership, _, { db }): Promise<string> {
    if (parent.url) {
      return parent.url;
    } else {
      const partner = await db.collectionPartner.findUnique({
        where: { id: parent.partnerId },
      });
      return partner.url;
    }
  },

  async imageUrl(
    parent: PrismaCollectionPartnership,
    _,
    { db }
  ): Promise<string> {
    if (parent.imageUrl) {
      return parent.imageUrl;
    } else {
      const partner = await db.collectionPartner.findUnique({
        where: { id: parent.partnerId },
      });
      return partner.imageUrl;
    }
  },

  async blurb(parent: PrismaCollectionPartnership, _, { db }): Promise<string> {
    if (parent.blurb) {
      return parent.blurb;
    } else {
      const partner = await db.collectionPartner.findUnique({
        where: { id: parent.partnerId },
      });
      return partner.blurb;
    }
  },
};
