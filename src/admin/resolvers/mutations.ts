import {
  Collection,
  CollectionAuthor,
  CollectionPartner,
  CollectionStory,
  Image,
  ImageEntityType,
  PrismaClient,
} from '@prisma/client';
import * as Sentry from '@sentry/node';
import { AuthenticationError } from 'apollo-server-errors';
import {
  CollectionPartnerAssociation,
  CreateCollectionAuthorInput,
  CreateCollectionInput,
  CreateCollectionPartnerAssociationInput,
  CreateCollectionPartnerInput,
  CreateCollectionStoryInput,
  CreateImageInput,
  UpdateCollectionAuthorImageUrlInput,
  UpdateCollectionAuthorInput,
  UpdateCollectionImageUrlInput,
  UpdateCollectionInput,
  UpdateCollectionPartnerAssociationImageUrlInput,
  UpdateCollectionPartnerAssociationInput,
  UpdateCollectionPartnerImageUrlInput,
  UpdateCollectionPartnerInput,
  UpdateCollectionStoryImageUrlInput,
  UpdateCollectionStoryInput,
  UpdateCollectionStorySortOrderInput,
} from '../../database/types';
import {
  associateImageWithEntity,
  createCollectionAuthor as dbCreateCollectionAuthor,
  createCollection as dbCreateCollection,
  createCollectionPartner as dbCreateCollectionPartner,
  createCollectionPartnerAssociation as dbCreateCollectionPartnerAssociation,
  createCollectionStory as dbCreateCollectionStory,
  createImage,
  deleteCollectionStory as dbDeleteCollectionStory,
  deleteCollectionPartnerAssociation as dbDeleteCollectionPartnerAssociation,
  updateCollectionAuthor as dbUpdateCollectionAuthor,
  updateCollectionAuthorImageUrl as dbUpdateCollectionAuthorImageUrl,
  updateCollection as dbUpdateCollection,
  updateCollectionImageUrl as dbUpdateCollectionImageUrl,
  updateCollectionPartner as dbUpdateCollectionPartner,
  updateCollectionPartnerImageUrl as dbUpdateCollectionPartnerImageUrl,
  updateCollectionPartnerAssociation as dbUpdateCollectionPartnerAssociation,
  updateCollectionPartnerAssociationImageUrl as dbUpdateCollectionPartnerAssociationImageUrl,
  updateCollectionStory as dbUpdateCollectionStory,
  updateCollectionStorySortOrder as dbUpdateCollectionStorySortOrder,
  updateCollectionStoryImageUrl as dbUpdateCollectionStoryImageUrl,
} from '../../database/mutations';
import { uploadImage } from '../../aws/upload';
import { IContext } from '../context';

/**
 * Executes a mutation, catches exceptions and records to sentry and console
 * @param context
 * @param data
 * @param callback
 * @param imageEntityType
 */
export async function executeMutation<T, U>(
  context: IContext,
  data: T,
  callback: (db: PrismaClient, data: T) => Promise<U>,
  imageEntityType: ImageEntityType = undefined
): Promise<U> {
  try {
    const { db, authenticatedUser } = context;

    if (!authenticatedUser.hasFullAccess) {
      throw new AuthenticationError(
        `You do not have access to perform this action.`
      );
    }

    const entity = await callback(db, data);
    // Associate the image with the entity if the image entity type is provided
    // and a record for the image exists
    if (imageEntityType) {
      await associateImageWithEntity(
        db,
        entity as U & { id: number; imageUrl: string },
        imageEntityType
      );
    }

    return entity;
  } catch (ex) {
    console.log(ex);
    Sentry.captureException(ex);
    throw new Error(ex);
  }
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function createCollectionAuthor(
  parent,
  { data },
  context: IContext
): Promise<CollectionAuthor> {
  return executeMutation<CreateCollectionAuthorInput, CollectionAuthor>(
    context,
    data,
    dbCreateCollectionAuthor,
    ImageEntityType.COLLECTION_AUTHOR
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function updateCollectionAuthor(
  parent,
  { data },
  context: IContext
): Promise<CollectionAuthor> {
  return executeMutation<UpdateCollectionAuthorInput, CollectionAuthor>(
    context,
    data,
    dbUpdateCollectionAuthor,
    ImageEntityType.COLLECTION_AUTHOR
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function updateCollectionAuthorImageUrl(
  parent,
  { data },
  context: IContext
): Promise<CollectionAuthor> {
  return executeMutation<UpdateCollectionAuthorImageUrlInput, CollectionAuthor>(
    context,
    data,
    dbUpdateCollectionAuthorImageUrl,
    ImageEntityType.COLLECTION_AUTHOR
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function createCollection(
  parent,
  { data },
  context: IContext
): Promise<Collection> {
  return executeMutation<CreateCollectionInput, Collection>(
    context,
    data,
    dbCreateCollection,
    ImageEntityType.COLLECTION
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function updateCollection(
  parent,
  { data },
  context: IContext
): Promise<Collection> {
  return await executeMutation<UpdateCollectionInput, Collection>(
    context,
    data,
    dbUpdateCollection,
    ImageEntityType.COLLECTION
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function updateCollectionImageUrl(
  parent,
  { data },
  context: IContext
): Promise<Collection> {
  return await executeMutation<UpdateCollectionImageUrlInput, Collection>(
    context,
    data,
    dbUpdateCollectionImageUrl,
    ImageEntityType.COLLECTION
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function createCollectionPartner(
  parent,
  { data },
  context: IContext
): Promise<CollectionPartner> {
  return executeMutation<CreateCollectionPartnerInput, CollectionPartner>(
    context,
    data,
    dbCreateCollectionPartner,
    ImageEntityType.COLLECTION_PARTNER
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function updateCollectionPartner(
  parent,
  { data },
  context: IContext
): Promise<CollectionPartner> {
  return executeMutation<UpdateCollectionPartnerInput, CollectionPartner>(
    context,
    data,
    dbUpdateCollectionPartner,
    ImageEntityType.COLLECTION_PARTNER
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function updateCollectionPartnerImageUrl(
  parent,
  { data },
  context: IContext
): Promise<CollectionPartner> {
  return executeMutation<
    UpdateCollectionPartnerImageUrlInput,
    CollectionPartner
  >(
    context,
    data,
    dbUpdateCollectionPartnerImageUrl,
    ImageEntityType.COLLECTION_PARTNER
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function createCollectionPartnerAssociation(
  parent,
  { data },
  context: IContext
): Promise<CollectionPartnerAssociation> {
  return executeMutation<
    CreateCollectionPartnerAssociationInput,
    CollectionPartnerAssociation
  >(
    context,
    data,
    dbCreateCollectionPartnerAssociation,
    ImageEntityType.COLLECTION_PARTNERSHIP
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function updateCollectionPartnerAssociation(
  parent,
  { data },
  context: IContext
): Promise<CollectionPartnerAssociation> {
  return executeMutation<
    UpdateCollectionPartnerAssociationInput,
    CollectionPartnerAssociation
  >(
    context,
    data,
    dbUpdateCollectionPartnerAssociation,
    ImageEntityType.COLLECTION_PARTNERSHIP
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function updateCollectionPartnerAssociationImageUrl(
  parent,
  { data },
  context: IContext
): Promise<CollectionPartnerAssociation> {
  return executeMutation<
    UpdateCollectionPartnerAssociationImageUrlInput,
    CollectionPartnerAssociation
  >(
    context,
    data,
    dbUpdateCollectionPartnerAssociationImageUrl,
    ImageEntityType.COLLECTION_PARTNERSHIP
  );
}

/**
 * @param parent
 * @param externalId
 * @param context
 */
export async function deleteCollectionPartnerAssociation(
  parent,
  { externalId },
  context: IContext
): Promise<CollectionPartnerAssociation> {
  return await executeMutation<string, CollectionPartnerAssociation>(
    context,
    externalId,
    dbDeleteCollectionPartnerAssociation
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function createCollectionStory(
  parent,
  { data },
  context: IContext
): Promise<CollectionStory> {
  return await executeMutation<CreateCollectionStoryInput, CollectionStory>(
    context,
    data,
    dbCreateCollectionStory,
    ImageEntityType.COLLECTION_STORY
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function updateCollectionStory(
  parent,
  { data },
  context: IContext
): Promise<CollectionStory> {
  return await executeMutation<UpdateCollectionStoryInput, CollectionStory>(
    context,
    data,
    dbUpdateCollectionStory,
    ImageEntityType.COLLECTION_STORY
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function updateCollectionStorySortOrder(
  parent,
  { data },
  context: IContext
): Promise<CollectionStory> {
  return await executeMutation<
    UpdateCollectionStorySortOrderInput,
    CollectionStory
  >(
    context,
    data,
    dbUpdateCollectionStorySortOrder,
    ImageEntityType.COLLECTION_STORY
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function updateCollectionStoryImageUrl(
  parent,
  { data },
  context: IContext
): Promise<CollectionStory> {
  return await executeMutation<
    UpdateCollectionStoryImageUrlInput,
    CollectionStory
  >(
    context,
    data,
    dbUpdateCollectionStoryImageUrl,
    ImageEntityType.COLLECTION_STORY
  );
}

/**
 * @param parent
 * @param externalId
 * @param context
 */
export async function deleteCollectionStory(
  parent,
  { externalId },
  context: IContext
): Promise<CollectionStory> {
  return await executeMutation<string, CollectionStory>(
    context,
    externalId,
    dbDeleteCollectionStory
  );
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function collectionImageUpload(
  parent,
  { data },
  context: IContext
) {
  const { s3service } = context;
  const { image, ...imageData } = data;
  await data.image.promise;
  const upload = await uploadImage(s3service, image.file);

  await executeMutation<CreateImageInput, Image>(
    context,
    { ...imageData, ...upload },
    createImage
  );

  return { url: upload.path };
}
