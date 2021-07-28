import { CollectionPartnership } from '../../database/types';
import { CollectionPartnership as PrismaCollectionPartnership } from '@prisma/client';

/**
 * This should work, but doesn't. It isn't even being called if I add it to resolvers
 *
 * @param parent
 * @param _
 * @param db
 */
export async function partnership(
  parent,
  _,
  { db }
): Promise<CollectionPartnership> {
  const partner = await db.collectionPartner.findUnique({
    where: { id: parent.partnerId },
  });

  return {
    externalId: parent.externalId,
    type: parent.type,
    name: parent.name ? parent.name : partner.name,
    url: parent.url ? parent.url : partner.url,
    imageUrl: parent.imageUrl ? parent.imageUrl : partner.imageUrl,
    blurb: parent.blurb ? parent.blurb : partner.blurb,
  };
}

/**
 * And this one works, but since fields are resolved separately, it's essentially
 * the same function repeated four times???
 */
export const partnershipFields = {
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
