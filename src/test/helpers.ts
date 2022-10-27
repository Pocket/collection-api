import slugify from 'slugify';
import {
  Collection,
  CollectionAuthor,
  CollectionPartner,
  CollectionPartnershipType,
  CollectionStatus,
  CollectionStory,
  CurationCategory,
  IABCategory,
  Label,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import {
  CollectionLanguage,
  CollectionPartnerAssociation,
  CollectionStoryAuthor,
  CreateCollectionAuthorInput,
  CreateLabelInput,
  CreateCollectionStoryInput,
} from '../database/types';
import { faker } from '@faker-js/faker';
import config from '../config';
import s3service from '../aws/s3';
import { client } from '../database/client';
import { ContextManager } from '../admin/context';
import { getServer } from './admin-server';

const slugifyConfig = config.slugify;

export async function createAuthorHelper(
  prisma: PrismaClient,
  name: string
): Promise<CollectionAuthor> {
  const slug = slugify(name, slugifyConfig);
  const imageUrl = faker.image.avatar();

  const data: CreateCollectionAuthorInput = { name, slug, imageUrl };

  return await prisma.collectionAuthor.create({ data });
}

// information required to create a Label
export async function createLabelHelper(
  prisma: PrismaClient,
  name?: string,
  createdBy?: string,
): Promise<Label> {
  name = name || faker.internet.userName();
  createdBy = createdBy || faker.lorem.slug();
  const data: CreateLabelInput = { name, createdBy };

  return await prisma.label.create({ data });
}

// the minimum information required to create a collection
export interface createCollectionHelperRequiredInput {
  title: string;
  author: CollectionAuthor;
}

// optional information you can provide when creating a collection
export interface createCollectionHelperOptionalInput {
  status?: CollectionStatus;
  curationCategory?: CurationCategory;
  publishedAt?: Date;
  imageUrl?: string;
  language?: CollectionLanguage;
  addStories?: boolean;
  IABParentCategory?: IABCategory;
  IABChildCategory?: IABCategory;
}

// the input for the `createCollectionHelper` function is a combo of the
// required and optional properties
export type createCollectionHelperInput = createCollectionHelperRequiredInput &
  createCollectionHelperOptionalInput;

// the assumed defaults for the optional properties if not specified
const createCollectionHelperDefaults: createCollectionHelperOptionalInput = {
  status: 'DRAFT',
  addStories: true,
  curationCategory: null,
  publishedAt: null,
  imageUrl: null,
  language: CollectionLanguage.EN,
  IABParentCategory: null,
  IABChildCategory: null,
};

export interface createCollectionPartnerAssociationHelperInput {
  type?: CollectionPartnershipType;
  partner?: CollectionPartner;
  collection?: Collection;
  name?: string;
  url?: string;
  imageUrl?: string;
  blurb?: string;
}

export async function createCollectionHelper(
  prisma: PrismaClient,
  params: createCollectionHelperInput
): Promise<Collection> {
  // start with defaults and override with any user-provided values
  const mergedParams: createCollectionHelperInput = Object.assign(
    {}, // start with an empty object
    createCollectionHelperDefaults, // add in all defaults
    params // add all specified params, which can/may override defaults
  );

  const {
    title,
    author,
    status,
    curationCategory,
    publishedAt,
    imageUrl,
    language,
    addStories,
    IABParentCategory,
    IABChildCategory,
  } = mergedParams;

  const data: Prisma.CollectionCreateInput = {
    title,
    slug: slugify(title, slugifyConfig),
    excerpt: faker.lorem.sentences(2),
    intro: faker.lorem.paragraphs(2),
    status,
    language,
    authors: {
      connect: {
        id: author.id,
      },
    },
  };

  if (status === CollectionStatus.PUBLISHED && publishedAt) {
    data.publishedAt = publishedAt;
  }

  data.imageUrl =
    imageUrl || faker.image.imageUrl(640, 480, 'arch', true, true);

  if (curationCategory) {
    data.curationCategory = { connect: { id: curationCategory.id } };
  }

  if (IABParentCategory) {
    data.IABParentCategory = { connect: { id: IABParentCategory.id } };

    // only set a sub category if the parent was also set
    if (IABChildCategory) {
      data.IABChildCategory = { connect: { id: IABChildCategory.id } };
    }
  }

  const collection = await prisma.collection.create({ data });

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

  if (addStories) {
    for (let i = 0; i < getRandomInt(2, 6); i++) {
      await createCollectionStoryHelper(prisma, {
        collectionId: collection.id,
        url: faker.internet.url(),
        title: faker.lorem.sentence(),
        excerpt: faker.lorem.paragraph(),
        imageUrl:
          imageUrl || faker.image.imageUrl(640, 480, 'nature', true, true),
        authors: [
          {
            name: `${faker.name.firstName()} ${faker.name.lastName()}`,
            sortOrder: faker.datatype.number(),
          },
          {
            name: `${faker.name.firstName()} ${faker.name.lastName()}`,
            sortOrder: faker.datatype.number(),
          },
        ],
        publisher: faker.company.companyName(),
        fromPartner: faker.datatype.boolean(),
      });
    }
  }

  return collection;
}

export async function createCollectionStoryHelper(
  prisma: PrismaClient,
  collectionStory: {
    collectionId: number;
  } & Omit<CreateCollectionStoryInput, 'collectionExternalId'>
): Promise<CollectionStory> {
  const data: any = collectionStory;
  data.authors = {
    create: collectionStory.authors,
  };

  return await prisma.collectionStory.create({
    data,
  });
}

export async function createCurationCategoryHelper(
  prisma: PrismaClient,
  name: string
): Promise<CurationCategory> {
  const slug = slugify(name, slugifyConfig);

  const data: Prisma.CurationCategoryCreateInput = { name, slug };

  return await prisma.curationCategory.create({ data });
}

export async function createIABCategoryHelper(
  prisma: PrismaClient,
  name: string,
  parent?: IABCategory
): Promise<IABCategory> {
  const slug = slugify(name, slugifyConfig);

  const data: Prisma.IABCategoryCreateInput = { name, slug };

  if (parent) {
    data.parent = { connect: { id: parent.id } };
  }

  return await prisma.iABCategory.create({ data });
}

export async function createPartnerHelper(
  prisma: PrismaClient,
  name?: string
): Promise<CollectionPartner> {
  const data: Prisma.CollectionPartnerCreateInput = {
    name: name ? name : faker.company.companyName(),
    url: faker.internet.url(),
    imageUrl: faker.image.imageUrl(640, 480, 'tech', true, true),
    blurb: faker.lorem.paragraphs(2),
  };

  return await prisma.collectionPartner.create({ data });
}

export async function createCollectionPartnerAssociationHelper(
  prisma: PrismaClient,
  params: createCollectionPartnerAssociationHelperInput
): Promise<CollectionPartnerAssociation> {
  let partner: CollectionPartner;
  if (!params.partner) {
    partner = await createPartnerHelper(prisma, faker.company.companyName());
  } else {
    partner = params.partner;
  }

  let collection: Collection;
  if (!params.collection) {
    // create a collection author
    const author = await createAuthorHelper(
      prisma,
      `${faker.name.firstName()} ${faker.name.lastName()}`
    );

    // use this author to create a collection
    collection = await createCollectionHelper(prisma, {
      title: faker.lorem.sentence(),
      author,
    });
  } else {
    collection = params.collection;
  }

  if (!params.type) {
    params.type = CollectionPartnershipType.SPONSORED;
  }

  const data: Prisma.CollectionPartnershipCreateInput = {
    // add optional variables
    ...params,
    partner: { connect: { externalId: partner.externalId } },
    collection: { connect: { externalId: collection.externalId } },
  };

  return await prisma.collectionPartnership.create({
    data,
    include: {
      partner: true,
      collection: true,
    },
  });
}

export async function clear(prisma: PrismaClient): Promise<void> {
  // partnerships and partner information
  await prisma.collectionPartnership.deleteMany({});
  await prisma.collectionPartner.deleteMany({});

  // collection stories
  await prisma.collectionStoryAuthor.deleteMany({});
  await prisma.collectionStory.deleteMany({});

  // collection authors and collections themselves
  await prisma.collectionAuthor.deleteMany({});
  await prisma.collection.deleteMany({});

  // categorisation data for collections
  await prisma.iABCategory.deleteMany({});
  await prisma.curationCategory.deleteMany({});

  // images
  await prisma.image.deleteMany({});
}

export function sortCollectionStoryAuthors(
  authors: CollectionStoryAuthor[]
): CollectionStoryAuthor[] {
  // manually sort the authors of the first story by their `sortOrder`
  // property
  return authors.sort((a, b) => {
    // this coerces the sort function to treat sortOrder as a number and not
    // a string. oh javascript.
    return a.sortOrder - b.sortOrder;
  });
}

const sharedConfigContext = {
  request: { headers: {} },
  db: client(),
  s3service,
};

/**
 * Pass custom mocked headers to Apollo Server to test access control checks
 * within resolvers.
 *
 * @param headers
 */
export const getServerWithMockedHeaders = (headers: {
  name: string;
  username: string;
  groups: string;
}) => {
  const contextManager = new ContextManager({
    ...sharedConfigContext,
    request: {
      headers,
    },
  });

  return getServer(contextManager);
};

/**
 * Determines if a url is a valid collection url and returns its slug.
 * Returns null for invalid collection urls
 * @param url
 * @returns A collection's slug or null
 */
export const getCollectionUrlSlug = (url: string): string | null => {
  // get a string of allowed languages in this format "en|de|..."
  const allowedLanguages = Object.values(CollectionLanguage).join('|');

  const regExpString = `^https?://(?:getpocket.com)(?:/(?:${allowedLanguages}))?/collections/(.*)`;

  // create a regular expression from the string above and make it case-insensitive
  const validCollectionUrlRegExp = new RegExp(regExpString, 'i');

  const match = validCollectionUrlRegExp.exec(url);
  if (!match) {
    console.log(`${url} is not a valid collection`);
    return null;
  }

  // return the slug that is captured as the second match group from the regex
  return match[1];
};
