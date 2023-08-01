import {
  CollectionLabel,
  CollectionPartner,
  CollectionPartnership,
  Label,
} from '@prisma/client';
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
 * Field-level resolvers for the Label type.
 *
 * Just like with the CollectionPartnership resolvers above, querying two fields
 * on the label entity doesn't result in two separate queries.
 *
 * In both cases, for a query that returns labels directly from the database
 * (e.g. `labels`), use the existing value from the Label table.
 *
 * For a query that goes through the CollectionLabel relationship table first,
 * look up the values for the corresponding label in its own table.
 */
export const collectionLabelsFieldResolvers = {
  async externalId(
    parent: Label | CollectionLabel,
    _,
    { db },
  ): Promise<string> {
    // TypeScript is unhappy while running integration tests without these specific
    // checks in place - if('externalId' in parent) rather than if(parent.externalId).

    // The 'externalId' prop is present only on the Label entity, so if that exists,
    // we can just return the value as is
    if ('externalId' in parent) {
      return parent.externalId;
    }

    // The 'labelId' is present only on the CollectionLabel entity, so we need to
    // query the linked Label entity to get the external ID of the label
    if ('labelId' in parent) {
      const label = await getLabelById(db, parent.labelId);
      return label.externalId;
    }

    return null;
  },

  async name(parent: Label | CollectionLabel, _, { db }): Promise<string> {
    // TypeScript is unhappy while running integration tests without these specific
    // checks in place - if('name' in parent) rather than if(parent.name).

    // The 'name' prop is present only on the Label entity, so if that exists, we can just
    // return the value as is
    if ('name' in parent) {
      return parent.name;
    }

    // The 'labelId' is present only on the CollectionLabel entity, so we need to
    // query the linked Label entity to get the name of the label
    if ('labelId' in parent) {
      const label = await getLabelById(db, parent.labelId);
      return label.name;
    }

    return null;
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
  id: number,
): Promise<CollectionPartner> => {
  return await db.collectionPartner.findUnique({
    where: { id },
  });
};

/**
 * Look up the collection label via its primary key.
 *
 * @param db
 * @param id
 */
export const getLabelById = async (
  db: PrismaClient,
  id: number,
): Promise<Label> => {
  return await db.label.findUnique({
    where: { id },
  });
};
