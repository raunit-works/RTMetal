'use client';

import * as React from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  ImageOff,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getImageErrorMessage } from '@/lib/images/prepare-image-upload';
import {
  DEFAULT_SWATCH_COLOR,
  normalizeHex,
  toFinishOptionPayload,
  toVariantRowValues,
  validateVariantDrafts,
  type FieldValidationError,
  type VariantDraftInput,
} from '@/lib/product-variants/variant-drafts';
import {
  defaultProductVariantsEditorServices,
  type ProductVariantsEditorServices,
} from '@/lib/product-variants/editor-services';
import { getVariantUploadBlocker } from '@/lib/product-variants/upload-gate';
import {
  saveProductVariants,
  type VariantSaveOperations,
} from '@/lib/product-variants/save-orchestrator';
import type { ProductVariantsSnapshot } from '@/lib/supabase/product-variants';
import type {
  ProductVariantImage,
  SwatchType,
  VariantAvailability,
} from '@/lib/types';

export type { FieldValidationError };

interface VariantImageDraft extends ProductVariantImage {
  key: string;
}

interface VariantUploadStatus {
  id: string;
  fileName: string;
  status: 'uploading' | 'error';
  message?: string;
  kind: 'variant-image' | 'swatch-image';
  file?: File;
}

interface VariantDraft extends VariantDraftInput {
  id?: string;
  optionValueId?: string;
  images: VariantImageDraft[];
  removedImageIds: string[];
  uploads: VariantUploadStatus[];
}

export interface ProductVariantsEditorHandle {
  validate: () => { banner: string | null; fields: FieldValidationError[] };
  sync: (productId: string) => Promise<string[]>;
  reset: () => void;
  isDirty: () => boolean;
  getDrafts: () => VariantDraftInput[];
}

interface ProductVariantsEditorProps {
  productId: string | null;
  services?: Partial<ProductVariantsEditorServices>;
  onDraftsChange?: (drafts: VariantDraftInput[]) => void;
}

function draftsForState(drafts: VariantDraft[]): VariantDraftInput[] {
  return drafts.map((draft) => ({
    key: draft.key,
    finishName: draft.finishName,
    swatchType: draft.swatchType,
    swatchColor1: draft.swatchColor1,
    swatchColor2: draft.swatchColor2,
    swatchImageUrl: draft.swatchImageUrl,
    sku: draft.sku,
    stockQuantity: draft.stockQuantity,
    availability: draft.availability,
    isActive: draft.isActive,
    isDefault: draft.isDefault,
  }));
}

const SELECT_CLASS =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const IMAGE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif';

const AVAILABILITY_OPTIONS: Array<{
  value: VariantAvailability;
  label: string;
}> = [
  { value: 'in_stock', label: 'In stock' },
  { value: 'made_to_order', label: 'Made to order' },
  { value: 'out_of_stock', label: 'Unavailable' },
];

const SWATCH_OPTIONS: Array<{ value: SwatchType; label: string }> = [
  { value: 'solid', label: 'Single colour' },
  { value: 'dual', label: 'Two colours' },
  { value: 'image', label: 'Image thumbnail' },
];

export const ProductVariantsEditor = React.forwardRef<
  ProductVariantsEditorHandle,
  ProductVariantsEditorProps
>(function ProductVariantsEditor(
  { productId, services: servicesProp, onDraftsChange },
  ref
) {
  const services = React.useMemo<ProductVariantsEditorServices>(
    () => ({ ...defaultProductVariantsEditorServices, ...servicesProp }),
    [servicesProp]
  );
  const [enabled, setEnabled] = React.useState(false);
  const [variants, setVariants] = React.useState<VariantDraft[]>([]);
  const [removedIds, setRemovedIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Map<string, string>>(
    new Map()
  );
  const [savedSignature, setSavedSignature] =
    React.useState(EMPTY_VARIANT_SIGNATURE);
  const [dirty, setDirty] = React.useState(false);

  const loadRequestRef = React.useRef(0);
  const enabledRef = React.useRef(enabled);
  const variantsRef = React.useRef(variants);
  const removedIdsRef = React.useRef(removedIds);
  const savingRef = React.useRef(saving);
  const baselineImagesByIdRef = React.useRef<Map<string, ProductVariantImage[]>>(
    new Map()
  );
  const sessionUploadsRef = React.useRef<Set<string>>(new Set());

  const trackSessionUpload = React.useCallback((url: string) => {
    if (url) sessionUploadsRef.current.add(url);
  }, []);

  const cleanupSessionUploads = React.useCallback(() => {
    const urls = Array.from(sessionUploadsRef.current);
    sessionUploadsRef.current.clear();
    urls.forEach((url) => {
      void services.deleteCatalogImageIfUnreferenced(url);
    });
  }, [services]);

  enabledRef.current = enabled;
  variantsRef.current = variants;
  removedIdsRef.current = removedIds;
  savingRef.current = saving;

  const applySnapshot = React.useCallback(
    (
      snapshot: ProductVariantsSnapshot,
      keepEnabledEmpty = false
    ) => {
      const finishOption =
        snapshot.options.find((option) => option.slug === 'finish') ??
        snapshot.options[0];
      const valuesById = new Map(
        (finishOption?.values ?? []).map((value) => [value.id, value])
      );

      const drafts: VariantDraft[] = snapshot.variants.map((variant) => {
        const value = variant.optionValueId
          ? valuesById.get(variant.optionValueId)
          : undefined;
        return {
          key: variant.id,
          id: variant.id,
          optionValueId: variant.optionValueId,
          finishName: value?.name ?? variant.finishName ?? '',
          swatchType: value?.swatchType ?? 'solid',
          swatchColor1: value?.swatchColor ?? DEFAULT_SWATCH_COLOR,
          swatchColor2: value?.swatchColorSecondary ?? '',
          swatchImageUrl: value?.swatchImageUrl ?? '',
          sku: variant.sku ?? '',
          stockQuantity:
            variant.stockQuantity != null ? String(variant.stockQuantity) : '',
          availability: variant.availability,
          isActive: variant.isActive,
          isDefault: variant.isDefault,
          images: variant.images.map(mapDraftImage),
          removedImageIds: [],
          uploads: [],
        };
      });

      const baselineImages = new Map<string, ProductVariantImage[]>();
      snapshot.variants.forEach((variant) => {
        baselineImages.set(variant.id, variant.images);
      });
      baselineImagesByIdRef.current = baselineImages;

      setVariants(drafts);
      setRemovedIds([]);
      setFieldErrors(new Map());
      setSavedSignature(signature(drafts));
      setDirty(false);
      setEnabled(drafts.length > 0 || keepEnabledEmpty);
    },
    []
  );

  const load = React.useCallback(
    async (id: string) => {
      cleanupSessionUploads();
      const requestId = ++loadRequestRef.current;
      setLoading(true);
      setLoadError(null);
      setFormError(null);
      try {
        const snapshot = await services.getProductVariantsAdmin(id);
        if (requestId !== loadRequestRef.current) return;
        applySnapshot(snapshot);
      } catch (error) {
        if (requestId !== loadRequestRef.current) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : 'The saved finishes could not be loaded.'
        );
        setVariants([]);
        setRemovedIds([]);
        setSavedSignature(EMPTY_VARIANT_SIGNATURE);
        setEnabled(false);
      } finally {
        if (requestId === loadRequestRef.current) setLoading(false);
      }
    },
    [applySnapshot, cleanupSessionUploads, services]
  );

  React.useEffect(() => {
    if (productId) {
      void load(productId);
    } else {
      cleanupSessionUploads();
      loadRequestRef.current += 1;
      setEnabled(false);
      setVariants([]);
      setRemovedIds([]);
      setSaving(false);
      setLoading(false);
      setLoadError(null);
      setFormError(null);
      setFieldErrors(new Map());
      setNotice(null);
      setSavedSignature(EMPTY_VARIANT_SIGNATURE);
    }
  }, [productId, load, cleanupSessionUploads]);

  React.useEffect(() => {
    setDirty(signature(variants) !== savedSignature);
  }, [variants, savedSignature]);

  React.useEffect(() => {
    onDraftsChange?.(draftsForState(variants));
  }, [onDraftsChange, variants]);

  React.useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  React.useEffect(
    () => () => {
      cleanupSessionUploads();
    },
    [cleanupSessionUploads]
  );

  const fieldErrorFor = (key: string, field: FieldValidationError['field']) =>
    fieldErrors.get(`${key}:${field}`);

  const clearFieldError = (key: string, field: FieldValidationError['field']) => {
    setFieldErrors((prev) => {
      const next = new Map(prev);
      next.delete(`${key}:${field}`);
      return next;
    });
  };

  const updateVariant = (key: string, patch: Partial<VariantDraft>) => {
    setVariants((current) =>
      current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft))
    );
    setFieldErrors((prev) => {
      const next = new Map(prev);
      (Object.keys(patch) as Array<keyof VariantDraft>).forEach((field) => {
        next.delete(`${key}:${String(field)}`);
      });
      return next;
    });
  };

  const updateActive = (key: string, isActive: boolean) => {
    setVariants((current) =>
      current.map((draft) =>
        draft.key === key
          ? { ...draft, isActive, isDefault: isActive ? draft.isDefault : false }
          : draft
      )
    );
    clearFieldError(key, 'finishName');
  };

  const scrollToFirstInvalidField = () => {
    window.requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>('[data-field-error]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    });
  };

  const setDefaultVariant = (key: string) => {
    setVariants((current) =>
      current.map((draft) => ({
        ...draft,
        isDefault: draft.key === key && draft.isActive,
      }))
    );
    clearFieldError(key, 'finishName');
  };

  const toggleEnabled = (next: boolean) => {
    setFormError(null);
    setNotice(null);
    if (next) {
      setEnabled(true);
      if (variants.length === 0) {
        setVariants([createEmptyDraft(true)]);
      }
      return;
    }

    const savedCount = variants.filter((draft) => draft.id).length;
    if (savedCount > 0) {
      setNotice(
        'Saved finishes remain active. Delete each finish explicitly before turning this off.'
      );
      return;
    }

    setVariants([]);
    setFieldErrors(new Map());
    setEnabled(false);
  };

  const addVariant = () => {
    setFormError(null);
    setVariants((current) => [
      ...current,
      createEmptyDraft(current.length === 0),
    ]);
  };

  const removeVariant = (key: string) => {
    const target = variants.find((draft) => draft.key === key);
    if (!target) return;

    if (target.id) {
      const confirmed = window.confirm(
        'Delete this saved finish? The parent product, shared product images and other finishes will not be deleted.'
      );
      if (!confirmed) return;
      const savedId = target.id;
      setRemovedIds((current) =>
        current.includes(savedId) ? current : [...current, savedId]
      );
    }

    setVariants((current) => current.filter((draft) => draft.key !== key));
    setFieldErrors((prev) => {
      const next = new Map(prev);
      Array.from(next.keys())
        .filter((entry) => entry.startsWith(`${key}:`))
        .forEach((entry) => next.delete(entry));
      return next;
    });
  };

  const moveVariant = (key: string, direction: 'up' | 'down') => {
    const index = variants.findIndex((draft) => draft.key === key);
    if (index < 0) return;
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= variants.length) return;
    const next = [...variants];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setVariants(next);
  };

  const upsertUploadStatus = (
    key: string,
    status: VariantUploadStatus
  ) => {
    setVariants((current) =>
      current.map((draft) => {
        if (draft.key !== key) return draft;
        const exists = draft.uploads.some((upload) => upload.id === status.id);
        return {
          ...draft,
          uploads: exists
            ? draft.uploads.map((upload) =>
                upload.id === status.id ? { ...upload, ...status } : upload
              )
            : [...draft.uploads, status],
        };
      })
    );
  };

  const dismissUpload = (key: string, uploadId: string) => {
    setVariants((current) =>
      current.map((draft) =>
        draft.key === key
          ? {
              ...draft,
              uploads: draft.uploads.filter((upload) => upload.id !== uploadId),
            }
          : draft
      )
    );
  };

  const failUpload = (
    key: string,
    uploadId: string,
    error: unknown,
    fallback: string
  ) => {
    setVariants((current) =>
      current.map((draft) =>
        draft.key === key
          ? {
              ...draft,
              uploads: draft.uploads.map((upload) =>
                upload.id === uploadId
                  ? {
                      ...upload,
                      status: 'error',
                      message:
                        error instanceof Error && error.message
                          ? error.message
                          : getImageErrorMessage(error) || fallback,
                    }
                  : upload
              ),
            }
          : draft
      )
    );
  };

  const runUpload = async (
    key: string,
    uploadId: string,
    file: File,
    kind: VariantUploadStatus['kind']
  ) => {
    upsertUploadStatus(key, {
      id: uploadId,
      fileName: file.name,
      status: 'uploading',
      kind,
      file,
    });

    try {
      const prepared = await services.prepareImageUpload(file, 'product-gallery');
      const imageUrl = await services.uploadCatalogImage(prepared.file);
      trackSessionUpload(imageUrl);

      setVariants((current) =>
        current.map((draft) => {
          if (draft.key !== key) return draft;
          if (kind === 'swatch-image') {
            return {
              ...draft,
              swatchImageUrl: imageUrl,
              uploads: draft.uploads.filter((upload) => upload.id !== uploadId),
            };
          }

          const images = [...draft.images];
          images.push({
            key: createDraftKey(),
            id: '',
            variantId: draft.id ?? '',
            imageUrl,
            altText: draft.finishName.trim() || 'Finish image',
            sortOrder: images.length,
            isPrimary: images.length === 0,
          });
          return {
            ...draft,
            images,
            uploads: draft.uploads.filter((upload) => upload.id !== uploadId),
          };
        })
      );
      if (kind === 'swatch-image') clearFieldError(key, 'swatchImageUrl');
    } catch (error) {
      failUpload(
        key,
        uploadId,
        error,
        kind === 'swatch-image'
          ? 'The swatch image could not be uploaded.'
          : 'The finish image could not be uploaded.'
      );
    }
  };

  const handleVariantImageUpload = (key: string, files: File[]) => {
    if (files.length === 0) return;
    files.forEach((file) => {
      void runUpload(key, createDraftKey(), file, 'variant-image');
    });
  };

  const handleSwatchImageUpload = (key: string, file: File | undefined) => {
    if (!file) return;
    void runUpload(key, createDraftKey(), file, 'swatch-image');
  };

  const retryUpload = (key: string, uploadId: string) => {
    const upload = variantsRef.current
      .find((draft) => draft.key === key)
      ?.uploads.find((entry) => entry.id === uploadId);
    if (!upload?.file) {
      failUpload(
        key,
        uploadId,
        new Error('The original file is no longer available. Remove it and choose the file again.'),
        'The original file is no longer available.'
      );
      return;
    }
    void runUpload(key, uploadId, upload.file, upload.kind);
  };

  const removeImage = (variantKey: string, imageKey: string) => {
    const target = variantsRef.current
      .find((draft) => draft.key === variantKey)
      ?.images.find((image) => image.key === imageKey);
    if (!target) return;
    if (!target.id) {
      sessionUploadsRef.current.delete(target.imageUrl);
      void services.deleteCatalogImageIfUnreferenced(target.imageUrl);
    }
    setVariants((current) =>
      current.map((draft) => {
        if (draft.key !== variantKey) return draft;
        return {
          ...draft,
          images: draft.images.filter((image) => image.key !== imageKey),
          removedImageIds: target.id
            ? [...draft.removedImageIds, target.id]
            : draft.removedImageIds,
        };
      })
    );
  };

  const moveImage = (variantKey: string, imageKey: string, direction: 'up' | 'down') => {
    setVariants((current) =>
      current.map((draft) => {
        if (draft.key !== variantKey) return draft;
        const index = draft.images.findIndex((image) => image.key === imageKey);
        const nextIndex = direction === 'up' ? index - 1 : index + 1;
        if (index < 0 || nextIndex < 0 || nextIndex >= draft.images.length) {
          return draft;
        }
        const images = [...draft.images];
        [images[index], images[nextIndex]] = [images[nextIndex], images[index]];
        return { ...draft, images };
      })
    );
  };

  const setPrimaryImage = (variantKey: string, imageKey: string) => {
    setVariants((current) =>
      current.map((draft) =>
        draft.key === variantKey
          ? {
              ...draft,
              images: draft.images.map((image) => ({
                ...image,
                isPrimary: image.key === imageKey,
              })),
            }
          : draft
      )
    );
  };

  const validate = React.useCallback(
    (): { banner: string | null; fields: FieldValidationError[] } => {
      if (!enabledRef.current) return { banner: null, fields: [] };
      const validation = validateVariantDrafts(variantsRef.current);
      if (validation.banner) return validation;
      const uploadBlocker = getVariantUploadBlocker(variantsRef.current);
      return uploadBlocker
        ? { banner: uploadBlocker, fields: [] }
        : validation;
    },
    []
  );

  React.useImperativeHandle(
    ref,
    () => ({
      validate,
      isDirty: () => dirty,
      reset: () => {
        cleanupSessionUploads();
        loadRequestRef.current += 1;
        setEnabled(false);
        setVariants([]);
        setRemovedIds([]);
        setSaving(false);
        setLoading(false);
        setLoadError(null);
        setFormError(null);
        setFieldErrors(new Map());
        setNotice(null);
        setSavedSignature(EMPTY_VARIANT_SIGNATURE);
        setDirty(false);
        baselineImagesByIdRef.current = new Map();
      },
      sync: async (id: string) => {
        if (savingRef.current) {
          return ['A finish save is already in progress. Please wait for it to finish.'];
        }

        const drafts = variantsRef.current;
        const isEnabled = enabledRef.current;
        const pendingRemovals = removedIdsRef.current;

        if (!isEnabled && drafts.length === 0 && pendingRemovals.length === 0) {
          return [];
        }

        const uploadBlocker = getVariantUploadBlocker(drafts);
        if (uploadBlocker) {
          setFormError(uploadBlocker);
          setNotice(null);
          return [uploadBlocker];
        }

        const validation = isEnabled
          ? validateVariantDrafts(drafts)
          : { banner: null, fields: [] as FieldValidationError[] };

        if (validation.banner) {
          setFormError(validation.banner);
          setFieldErrors(
            new Map(
              validation.fields.map((field) => [
                `${field.key}:${field.field}`,
                field.message,
              ])
            )
          );
          setNotice(null);
          scrollToFirstInvalidField();
          return [validation.banner];
        }

        savingRef.current = true;
        setSaving(true);
        setFormError(null);
        setFieldErrors(new Map());
        setNotice(null);

        try {
          if (!isEnabled) {
            for (const variantId of pendingRemovals) {
              await services.deleteVariantAdmin(variantId);
            }
            const snapshot = await services.getProductVariantsAdmin(id);
            applySnapshot(snapshot);
            cleanupSessionUploads();
            if (pendingRemovals.length > 0) {
              setNotice('Finish removed.');
            }
            return [];
          }

          const operations: VariantSaveOperations = {
            ensureFinishOption: (productId) =>
              services.ensureFinishOptionAdmin(productId),
            saveOptionValue: async (input) => {
              const result = await services.saveVariantOptionValueAdmin({
                id: input.id,
                optionId: input.optionId,
                ...input.finishPayload,
                displayOrder: input.displayOrder,
              });
              return { id: result.value.id, created: result.created };
            },
            createVariant: ({ productId, rowValues, displayOrder }) =>
              services.createVariantAdmin({
                productId,
                sku: rowValues.sku,
                stockQuantity: rowValues.stockQuantity,
                availability: rowValues.availability,
                isActive: rowValues.isActive,
                isDefault: false,
                displayOrder,
              }),
            updateVariant: ({ variantId, rowValues, displayOrder }) =>
              services.updateVariantAdmin(variantId, {
                sku: rowValues.sku,
                stock_quantity: rowValues.stockQuantity,
                availability: rowValues.availability,
                is_active: rowValues.isActive,
                is_default: false,
                display_order: displayOrder,
              }),
            linkVariantOption: ({ variantId, optionId, optionValueId }) =>
              services.linkVariantOptionAdmin(variantId, optionId, optionValueId),
            deleteVariant: (variantId) =>
              services.deleteVariantAdmin(variantId),
            deleteOptionValue: (optionValueId) =>
              services.deleteVariantOptionValueAdmin(optionValueId),
            syncImages: ({ variantId, desired, baseline, removedIds }) =>
              services.syncVariantImagesAdmin(
                variantId,
                desired,
                baseline,
                removedIds
              ),
            reorderVariants: (productId, variantIds) =>
              services.reorderVariantsAdmin(productId, variantIds),
            setDefaultVariant: (productId, variantId) =>
              services.setDefaultVariantAdmin(productId, variantId),
          };

          const saveDrafts = drafts.map((draft, index) => ({
            key: draft.key,
            id: draft.id,
            optionValueId: draft.optionValueId,
            finishName: draft.finishName,
            finishPayload: toFinishOptionPayload(draft),
            rowValues: toVariantRowValues(draft),
            displayOrder: index + 1,
            isDefault: draft.isDefault,
            images: draft.images,
            baselineImages: draft.id
              ? baselineImagesByIdRef.current.get(draft.id) ?? []
              : [],
            removedImageIds: draft.removedImageIds,
          }));

          const result = await saveProductVariants({
            productId: id,
            drafts: saveDrafts,
            removedVariantIds: pendingRemovals,
            operations,
          });

          const snapshot = await services.getProductVariantsAdmin(id);
          applySnapshot(snapshot);
          cleanupSessionUploads();

          const saveFailures = result.failures;
          const imageFailures = result.imageFailures;

          if (saveFailures.length > 0) {
            const message = `Only part of the finish save completed. ${saveFailures
              .map((failure) => failure.message)
              .join(' ')}`;
            setFormError(message);
            return [message];
          }

          if (imageFailures.length > 0) {
            const message = `The finishes were saved, but ${
              imageFailures.length
            } finish image${
              imageFailures.length === 1 ? '' : 's'
            } could not be saved. ${imageFailures[0].message}`;
            setFormError(message);
            return [message];
          }

          setNotice('Product finishes saved.');
          return [];
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'The product finishes could not be saved.';
          setFormError(
            `The finish save did not complete. ${message} Reopen this product to check what was saved.`
          );
          try {
            const snapshot = await services.getProductVariantsAdmin(id);
            applySnapshot(snapshot);
          } catch (refreshError) {
            console.error(
              '[ProductVariantsEditor] Could not refresh finishes after a failed save:',
              refreshError
            );
          }
          return [message];
        } finally {
          savingRef.current = false;
          setSaving(false);
        }
      },
      getDrafts: () => draftsForState(variantsRef.current),
    }),
    [applySnapshot, cleanupSessionUploads, dirty, services, validate]
  );

  if (loading) {
    return (
      <section className="space-y-3 border-t border-border/60 pt-4">
        <p className="border-b border-border pb-1 text-xs font-bold uppercase tracking-wider text-gold-deep">
          7. Product Finishes
        </p>
        <div className="flex items-center justify-center rounded-xl border border-border/60 bg-background/40 p-8 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading saved finishes...
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 border-t border-border/60 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="border-b border-border pb-1 text-xs font-bold uppercase tracking-wider text-gold-deep">
            7. Product Finishes
          </p>
          <p className="mt-2 max-w-xl text-xs text-muted-foreground">
            Offer this product in multiple finishes. Each finish keeps its own
            SKU, stock, swatch and images, while the parent product stays a
            single catalogue item.
          </p>
        </div>
        {saving && (
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-medium text-gold-deep">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving finishes...
          </span>
        )}
      </div>

      {loadError && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-2">
            <p>{loadError}</p>
            {productId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void load(productId)}
              >
                Retry loading finishes
              </Button>
            )}
          </div>
        </div>
      )}

      {formError && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={enabled}
          disabled={saving}
          onChange={(event) => toggleEnabled(event.currentTarget.checked)}
        />
        <span>
          <span className="block text-sm font-medium">
            This product has multiple finishes/colours
          </span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            When off, the product uses its product-level finish and gallery.
            Saved finishes are never deleted automatically.
          </span>
        </span>
      </label>

      {enabled && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {variants.length === 0
                ? 'No finishes yet.'
                : `${variants.length} finish${variants.length === 1 ? '' : 'es'} configured.`}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariant}
              disabled={saving}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add finish
            </Button>
          </div>

          {variants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background/30 p-8 text-center">
              <ImageOff className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No finishes yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add the first finish to offer this product in another colour or
                material.
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-3"
                onClick={addVariant}
                disabled={saving}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add finish
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((draft, index) => {
                const nameError = fieldErrorFor(draft.key, 'finishName');
                const skuError = fieldErrorFor(draft.key, 'sku');
                const stockError = fieldErrorFor(draft.key, 'stockQuantity');
                const colorOneError = fieldErrorFor(draft.key, 'swatchColor1');
                const colorTwoError = fieldErrorFor(draft.key, 'swatchColor2');
                const swatchImageError = fieldErrorFor(
                  draft.key,
                  'swatchImageUrl'
                );

                return (
                  <div
                    key={draft.key}
                    className="rounded-xl border border-border/60 bg-background/40 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                          {index + 1}
                        </span>
                        <span className="truncate text-sm font-semibold">
                          {draft.finishName.trim() || 'New finish'}
                        </span>
                        {draft.isDefault && (
                          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-deep">
                            Default
                          </span>
                        )}
                        {!draft.isActive && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        <label className="mr-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5"
                            checked={draft.isActive}
                            disabled={saving}
                            onChange={(event) =>
                              updateActive(draft.key, event.currentTarget.checked)
                            }
                          />
                          Active
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Move finish up"
                          disabled={saving || index === 0}
                          onClick={() => moveVariant(draft.key, 'up')}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Move finish down"
                          disabled={saving || index === variants.length - 1}
                          onClick={() => moveVariant(draft.key, 'down')}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          aria-label="Delete finish"
                          disabled={saving}
                          onClick={() => removeVariant(draft.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`finish-name-${draft.key}`}>
                          Finish name *
                        </Label>
                        <Input
                          id={`finish-name-${draft.key}`}
                          value={draft.finishName}
                          onChange={(event) =>
                            updateVariant(draft.key, {
                              finishName: event.currentTarget.value,
                            })
                          }
                          placeholder="Gold, Silver, Antique Bronze"
                          disabled={saving}
                          aria-invalid={Boolean(nameError)}
                          aria-describedby={
                            nameError ? `finish-name-${draft.key}-error` : undefined
                          }
                          data-field-error={nameError ? 'true' : undefined}
                        />
                        <FieldError
                          id={`finish-name-${draft.key}-error`}
                          message={nameError}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`finish-sku-${draft.key}`}>SKU</Label>
                        <Input
                          id={`finish-sku-${draft.key}`}
                          value={draft.sku}
                          onChange={(event) =>
                            updateVariant(draft.key, {
                              sku: event.currentTarget.value,
                            })
                          }
                          placeholder="RTM-ASHOK-GLD"
                          disabled={saving}
                          aria-invalid={Boolean(skuError)}
                          aria-describedby={
                            skuError ? `finish-sku-${draft.key}-error` : undefined
                          }
                          data-field-error={skuError ? 'true' : undefined}
                        />
                        <FieldError
                          id={`finish-sku-${draft.key}-error`}
                          message={skuError}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`finish-stock-${draft.key}`}>
                          Stock quantity
                        </Label>
                        <Input
                          id={`finish-stock-${draft.key}`}
                          type="number"
                          min={0}
                          step={1}
                          value={draft.stockQuantity}
                          onChange={(event) =>
                            updateVariant(draft.key, {
                              stockQuantity: event.currentTarget.value,
                            })
                          }
                          placeholder="Leave blank when stock is not tracked"
                          disabled={saving}
                          aria-invalid={Boolean(stockError)}
                          aria-describedby={
                            stockError
                              ? `finish-stock-${draft.key}-error`
                              : undefined
                          }
                          data-field-error={stockError ? 'true' : undefined}
                        />
                        <FieldError
                          id={`finish-stock-${draft.key}-error`}
                          message={stockError}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`finish-availability-${draft.key}`}>
                          Availability
                        </Label>
                        <select
                          id={`finish-availability-${draft.key}`}
                          className={SELECT_CLASS}
                          value={draft.availability}
                          disabled={saving}
                          onChange={(event) =>
                            updateVariant(draft.key, {
                              availability: event.currentTarget
                                .value as VariantAvailability,
                            })
                          }
                        >
                          {AVAILABILITY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label htmlFor={`finish-swatch-${draft.key}`}>Swatch</Label>
                      <select
                        id={`finish-swatch-${draft.key}`}
                        className={SELECT_CLASS}
                        value={draft.swatchType}
                        disabled={saving}
                        onChange={(event) =>
                          updateVariant(draft.key, {
                            swatchType: event.currentTarget.value as SwatchType,
                          })
                        }
                      >
                        {SWATCH_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {(draft.swatchType === 'solid' ||
                        draft.swatchType === 'dual') && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <Label
                              htmlFor={`finish-color-one-${draft.key}`}
                              className="text-[11px] text-muted-foreground"
                            >
                              {draft.swatchType === 'dual'
                                ? 'Primary colour'
                                : 'Colour'}
                            </Label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                aria-label="Primary swatch colour picker"
                                className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1 disabled:opacity-60"
                                value={normalizeHex(draft.swatchColor1)}
                                disabled={saving}
                                onChange={(event) =>
                                  updateVariant(draft.key, {
                                    swatchColor1: event.currentTarget.value,
                                  })
                                }
                              />
                              <Input
                                id={`finish-color-one-${draft.key}`}
                                value={draft.swatchColor1}
                                onChange={(event) =>
                                  updateVariant(draft.key, {
                                    swatchColor1: event.currentTarget.value,
                                  })
                                }
                                placeholder="#C9A96E"
                                disabled={saving}
                                aria-invalid={Boolean(colorOneError)}
                                aria-describedby={
                                  colorOneError
                                    ? `finish-color-one-${draft.key}-error`
                                    : undefined
                                }
                                data-field-error={
                                  colorOneError ? 'true' : undefined
                                }
                              />
                            </div>
                            <FieldError
                              id={`finish-color-one-${draft.key}-error`}
                              message={colorOneError}
                            />
                          </div>

                          {draft.swatchType === 'dual' && (
                            <div>
                              <Label
                                htmlFor={`finish-color-two-${draft.key}`}
                                className="text-[11px] text-muted-foreground"
                              >
                                Secondary colour
                              </Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  aria-label="Secondary swatch colour picker"
                                  className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1 disabled:opacity-60"
                                  value={normalizeHex(draft.swatchColor2)}
                                  disabled={saving}
                                  onChange={(event) =>
                                    updateVariant(draft.key, {
                                      swatchColor2: event.currentTarget.value,
                                    })
                                  }
                                />
                                <Input
                                  id={`finish-color-two-${draft.key}`}
                                  value={draft.swatchColor2}
                                  onChange={(event) =>
                                    updateVariant(draft.key, {
                                      swatchColor2: event.currentTarget.value,
                                    })
                                  }
                                  placeholder="#8A6A3B"
                                  disabled={saving}
                                  aria-invalid={Boolean(colorTwoError)}
                                  aria-describedby={
                                    colorTwoError
                                      ? `finish-color-two-${draft.key}-error`
                                      : undefined
                                  }
                                  data-field-error={
                                    colorTwoError ? 'true' : undefined
                                  }
                                />
                              </div>
                              <FieldError
                                id={`finish-color-two-${draft.key}-error`}
                                message={colorTwoError}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {draft.swatchType === 'image' && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {draft.swatchImageUrl ? (
                              <span className="h-10 w-10 overflow-hidden rounded-full border border-border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={draft.swatchImageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </span>
                            ) : (
                              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                                <ImageOff className="h-4 w-4" />
                              </span>
                            )}
                            <Input
                              value={draft.swatchImageUrl}
                              onChange={(event) =>
                                updateVariant(draft.key, {
                                  swatchImageUrl: event.currentTarget.value,
                                })
                              }
                              placeholder="https://..."
                              disabled={saving}
                              aria-invalid={Boolean(swatchImageError)}
                              aria-describedby={
                                swatchImageError
                                  ? `finish-swatch-image-${draft.key}-error`
                                  : undefined
                              }
                              data-field-error={
                                swatchImageError ? 'true' : undefined
                              }
                            />
                            <label
                              className={`inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-muted/60 px-3 py-2 text-xs font-medium hover:bg-muted ${
                                saving ? 'pointer-events-none opacity-60' : ''
                              }`}
                            >
                              <Upload className="h-3.5 w-3.5" />
                              Upload
                              <input
                                type="file"
                                accept={IMAGE_ACCEPT}
                                className="hidden"
                                disabled={saving}
                                onChange={(event) => {
                                  const file = event.currentTarget.files?.[0];
                                  event.currentTarget.value = '';
                                  void handleSwatchImageUpload(draft.key, file);
                                }}
                              />
                            </label>
                          </div>
                          <FieldError
                            id={`finish-swatch-image-${draft.key}-error`}
                            message={swatchImageError}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label>Finish images</Label>
                        <label
                          className={`inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-muted/60 px-3 py-2 text-xs font-medium hover:bg-muted ${
                            saving ? 'pointer-events-none opacity-60' : ''
                          }`}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Add images
                          <input
                            type="file"
                            accept={IMAGE_ACCEPT}
                            multiple
                            className="hidden"
                            disabled={saving}
                            onChange={(event) => {
                              const files = Array.from(
                                event.currentTarget.files ?? []
                              );
                              event.currentTarget.value = '';
                              void handleVariantImageUpload(draft.key, files);
                            }}
                          />
                        </label>
                      </div>

                      {draft.images.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border bg-background/30 p-4 text-center text-[11px] text-muted-foreground">
                          No finish-specific images. The product gallery is used
                          until an image is added here.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {draft.images.map((image, imageIndex) => (
                            <div
                              key={image.key}
                              className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={image.imageUrl}
                                alt={
                                  image.altText ||
                                  `${draft.finishName || 'Finish'} image ${
                                    imageIndex + 1
                                  }`
                                }
                                className="h-full w-full object-cover"
                              />
                              {image.isPrimary && (
                                <span className="absolute left-1 top-1 rounded bg-gold/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink">
                                  Primary
                                </span>
                              )}
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    aria-label="Move image up"
                                    disabled={saving || imageIndex === 0}
                                    onClick={() =>
                                      moveImage(draft.key, image.key, 'up')
                                    }
                                    className="rounded bg-background/80 p-1 text-foreground disabled:opacity-40"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Move image down"
                                    disabled={
                                      saving ||
                                      imageIndex === draft.images.length - 1
                                    }
                                    onClick={() =>
                                      moveImage(draft.key, image.key, 'down')
                                    }
                                    className="rounded bg-background/80 p-1 text-foreground disabled:opacity-40"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPrimaryImage(draft.key, image.key)
                                  }
                                  disabled={saving || image.isPrimary}
                                  className="rounded bg-gold/90 px-1.5 py-0.5 text-[9px] font-bold text-ink disabled:opacity-60"
                                >
                                  Set primary
                                </button>
                                <button
                                  type="button"
                                  aria-label="Remove image"
                                  disabled={saving}
                                  onClick={() =>
                                    removeImage(draft.key, image.key)
                                  }
                                  className="rounded bg-destructive/90 p-1 text-white disabled:opacity-40"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {draft.uploads.length > 0 && (
                        <ul className="space-y-1">
                          {draft.uploads.map((upload) => (
                            <li
                              key={upload.id}
                              className={`flex items-start gap-1.5 rounded-lg border p-2 text-[11px] ${
                                upload.status === 'error'
                                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                                  : 'border-border/60 bg-muted/30 text-muted-foreground'
                              }`}
                            >
                              {upload.status === 'error' ? (
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="font-medium text-foreground">
                                  {upload.fileName}
                                </span>
                                {upload.message ? ` — ${upload.message}` : ' — uploading...'}
                                {upload.status === 'error' && (
                                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                                    <button
                                      type="button"
                                      className="rounded border border-destructive/40 px-2 py-0.5 font-medium text-destructive hover:bg-destructive/10"
                                      onClick={() =>
                                        retryUpload(draft.key, upload.id)
                                      }
                                      disabled={saving}
                                    >
                                      Retry
                                    </button>
                                    <button
                                      type="button"
                                      className="rounded border border-border px-2 py-0.5 font-medium text-muted-foreground hover:bg-muted"
                                      onClick={() =>
                                        dismissUpload(draft.key, upload.id)
                                      }
                                      disabled={saving}
                                    >
                                      Remove
                                    </button>
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                      <label className="inline-flex items-center gap-2 text-xs font-medium">
                        <input
                          type="radio"
                          name="product-finish-default"
                          className="h-3.5 w-3.5"
                          checked={draft.isDefault}
                          disabled={saving || !draft.isActive}
                          onChange={() => setDefaultVariant(draft.key)}
                        />
                        Default finish
                      </label>
                      <span className="text-[11px] text-muted-foreground">
                        Display order {index + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!enabled && (
        <p className="text-[11px] text-muted-foreground">
          The product displays as a single item using the product-level finish
          and images.
        </p>
      )}
    </section>
  );
});

ProductVariantsEditor.displayName = 'ProductVariantsEditor';

function FieldError({
  id,
  message,
}: {
  id: string;
  message: string | undefined;
}) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-[11px] text-destructive">
      {message}
    </p>
  );
}

let draftCounter = 0;

function createDraftKey() {
  draftCounter += 1;
  return `new-${Date.now()}-${draftCounter}`;
}

function createEmptyDraft(isDefault: boolean): VariantDraft {
  return {
    key: createDraftKey(),
    finishName: '',
    swatchType: 'solid',
    swatchColor1: DEFAULT_SWATCH_COLOR,
    swatchColor2: '',
    swatchImageUrl: '',
    sku: '',
    stockQuantity: '',
    availability: 'in_stock',
    isActive: true,
    isDefault,
    images: [],
    removedImageIds: [],
    uploads: [],
  };
}

function mapDraftImage(image: ProductVariantImage): VariantImageDraft {
  return { ...image, key: image.id };
}

function draftPayload(draft: VariantDraft) {
  return {
    finishName: draft.finishName.trim(),
    swatchType: draft.swatchType,
    swatchColor1: draft.swatchColor1,
    swatchColor2: draft.swatchColor2,
    swatchImageUrl: draft.swatchImageUrl,
    sku: draft.sku.trim(),
    stockQuantity: draft.stockQuantity,
    availability: draft.availability,
    isActive: draft.isActive,
    isDefault: draft.isDefault,
    images: draft.images.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText ?? '',
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    })),
  };
}

function signature(drafts: VariantDraft[]) {
  return JSON.stringify(
    drafts.map((draft) => ({ id: draft.id ?? null, ...draftPayload(draft) }))
  );
}

/**
 * Baseline used before any product is opened. An editor with no finishes is
 * not "dirty", otherwise the Admin workspace would ask the administrator to
 * discard unsaved finishes every time a product is opened for editing.
 */
const EMPTY_VARIANT_SIGNATURE = signature([]);
