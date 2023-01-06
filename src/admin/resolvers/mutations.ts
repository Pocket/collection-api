import {
  Collection,
  CollectionAuthor,
  CollectionPartner,
  CollectionStory,
  Image,
  ImageEntityType,
  Label,
} from '@prisma/client';
import { AuthenticationError } from '@pocket-tools/apollo-utils';
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
  createLabel as dbCreateLabel,
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
import { ACCESS_DENIED_ERROR } from '../../shared/constants';
import { AdminAPIUser, IAdminContext } from '../context';

/**
 * Executes a mutation, catches exceptions and records to sentry and console
 * @param context
 * @param data
 * @param callback
 * @param imageEntityType
 */
export async function executeMutation<T, U>(
  context: IAdminContext,
  data: T,
  callback: (db, data: T, authenticatedUser?: AdminAPIUser) => Promise<U>,
  imageEntityType: ImageEntityType = undefined
): Promise<U> {
  const { db, authenticatedUser } = context;

  if (!authenticatedUser.hasFullAccess) {
    throw new AuthenticationError(ACCESS_DENIED_ERROR);
  }

  const entity = await callback(db, data, authenticatedUser);
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
}

/**
 * @param parent
 * @param data
 * @param context
 */
export async function createCollectionAuthor(
  parent,
  { data },
  context: IAdminContext
): Promise<CollectionAuthor> {
  return await executeMutation<CreateCollectionAuthorInput, CollectionAuthor>(
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
  context: IAdminContext
): Promise<CollectionAuthor> {
  return await executeMutation<UpdateCollectionAuthorInput, CollectionAuthor>(
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
  context: IAdminContext
): Promise<CollectionAuthor> {
  return await executeMutation<
    UpdateCollectionAuthorImageUrlInput,
    CollectionAuthor
  >(
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
  context: IAdminContext
): Promise<Collection> {
  return await executeMutation<CreateCollectionInput, Collection>(
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
  context: IAdminContext
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
  context: IAdminContext
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
  context: IAdminContext
): Promise<CollectionPartner> {
  return await executeMutation<CreateCollectionPartnerInput, CollectionPartner>(
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
  context: IAdminContext
): Promise<CollectionPartner> {
  return await executeMutation<UpdateCollectionPartnerInput, CollectionPartner>(
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
  context: IAdminContext
): Promise<CollectionPartner> {
  return await executeMutation<
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
  context: IAdminContext
): Promise<CollectionPartnerAssociation> {
  return await executeMutation<
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
  context: IAdminContext
): Promise<CollectionPartnerAssociation> {
  return await executeMutation<
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
  context: IAdminContext
): Promise<CollectionPartnerAssociation> {
  return await executeMutation<
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
  context: IAdminContext
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
  context: IAdminContext
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
  context: IAdminContext
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
  context: IAdminContext
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
  context: IAdminContext
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
  context: IAdminContext
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
  context: IAdminContext
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

export async function createLabel(
  parent,
  { name },
  context: IAdminContext
): Promise<Label> {
  return await executeMutation<string, Label>(context, name, dbCreateLabel);
}
