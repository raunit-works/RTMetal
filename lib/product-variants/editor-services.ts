import { deleteCatalogImageIfUnreferenced, uploadCatalogImage } from '@/lib/supabase/admin-catalog';
import {
  createVariantAdmin,
  deleteVariantAdmin,
  deleteVariantOptionValueAdmin,
  ensureFinishOptionAdmin,
  getProductVariantsAdmin,
  linkVariantOptionAdmin,
  reorderVariantsAdmin,
  saveVariantOptionValueAdmin,
  setDefaultVariantAdmin,
  syncVariantImagesAdmin,
  updateVariantAdmin,
} from '@/lib/supabase/product-variants-admin';
import {
  prepareImageUpload,
  type PreparedImage,
} from '@/lib/images/prepare-image-upload';
import type { ImagePurpose } from '@/lib/images/image-config';

export interface ProductVariantsEditorServices {
  getProductVariantsAdmin: typeof getProductVariantsAdmin;
  ensureFinishOptionAdmin: typeof ensureFinishOptionAdmin;
  saveVariantOptionValueAdmin: typeof saveVariantOptionValueAdmin;
  createVariantAdmin: typeof createVariantAdmin;
  updateVariantAdmin: typeof updateVariantAdmin;
  deleteVariantAdmin: typeof deleteVariantAdmin;
  deleteVariantOptionValueAdmin: typeof deleteVariantOptionValueAdmin;
  linkVariantOptionAdmin: typeof linkVariantOptionAdmin;
  reorderVariantsAdmin: typeof reorderVariantsAdmin;
  setDefaultVariantAdmin: typeof setDefaultVariantAdmin;
  syncVariantImagesAdmin: typeof syncVariantImagesAdmin;
  prepareImageUpload: (
    file: File,
    purpose: ImagePurpose
  ) => Promise<PreparedImage>;
  uploadCatalogImage: (file: File) => Promise<string>;
  deleteCatalogImageIfUnreferenced: (url: string) => Promise<boolean>;
}

export const defaultProductVariantsEditorServices: ProductVariantsEditorServices = {
  getProductVariantsAdmin,
  ensureFinishOptionAdmin,
  saveVariantOptionValueAdmin,
  createVariantAdmin,
  updateVariantAdmin,
  deleteVariantAdmin,
  deleteVariantOptionValueAdmin,
  linkVariantOptionAdmin,
  reorderVariantsAdmin,
  setDefaultVariantAdmin,
  syncVariantImagesAdmin,
  prepareImageUpload,
  uploadCatalogImage,
  deleteCatalogImageIfUnreferenced,
};
