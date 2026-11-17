'use client';

import * as React from 'react';
import {
  ProductVariantsEditor,
  type ProductVariantsEditorHandle,
} from '@/components/admin/products/product-variants-editor';
import type { ProductVariantsEditorServices } from '@/lib/product-variants/editor-services';
import type { PreparedImage } from '@/lib/images/prepare-image-upload';
import type {
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductVariantImage,
  SwatchType,
  VariantAvailability,
} from '@/lib/types';
import type { VariantDraftInput } from '@/lib/product-variants/variant-drafts';
import type { ProductVariantsSnapshot } from '@/lib/supabase/product-variants';

const PRODUCT_ID = '00000000-0000-4000-8000-000000000001';

interface FakeStore {
  option: ProductOption | null;
  variants: ProductVariant[];
  sequence: number;
  saveAttempts: number;
}

interface PendingUpload {
  url: string;
  resolve: (url: string) => void;
  reject: (error: Error) => void;
}

interface UploadControl {
  hold: boolean;
  failNext: boolean;
  pending: PendingUpload[];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'finish'
  );
}

function snapshotOf(store: FakeStore): ProductVariantsSnapshot {
  return {
    options: store.option ? [clone(store.option)] : [],
    variants: clone(store.variants),
  };
}

function createFakeServices(
  storeRef: React.MutableRefObject<FakeStore>,
  uploadControl: React.MutableRefObject<UploadControl>
): ProductVariantsEditorServices {
  const nextId = (prefix: string) => {
    storeRef.current.sequence += 1;
    return `${prefix}-${storeRef.current.sequence}`;
  };

  const ensureOption = (): ProductOption => {
    const store = storeRef.current;
    if (!store.option) {
      store.option = {
        id: 'option-1',
        productId: PRODUCT_ID,
        name: 'Finish',
        slug: 'finish',
        displayOrder: 0,
        values: [],
      };
    }
    return store.option;
  };

  const findValue = (valueId: string | undefined): ProductOptionValue | undefined =>
    ensureOption().values.find((value) => value.id === valueId);

  return {
    getProductVariantsAdmin: async () => snapshotOf(storeRef.current),
    ensureFinishOptionAdmin: async () => {
      storeRef.current.saveAttempts += 1;
      const option = ensureOption();
      return {
        id: option.id,
        name: option.name,
        slug: option.slug,
        productId: option.productId,
        displayOrder: option.displayOrder,
      };
    },
    saveVariantOptionValueAdmin: async (input) => {
      const option = ensureOption();
      const existing =
        findValue(input.id) ??
        option.values.find(
          (value) => value.name.toLowerCase() === input.name.toLowerCase()
        );
      const payload: ProductOptionValue = {
        id: existing?.id ?? nextId('value'),
        optionId: option.id,
        name: input.name,
        swatchType: input.swatchType as SwatchType,
        swatchColor: input.swatchColor,
        swatchColorSecondary: input.swatchColorSecondary,
        swatchImageUrl: input.swatchImageUrl,
        displayOrder: input.displayOrder ?? 0,
      };
      if (existing) {
        Object.assign(existing, payload);
        return { value: clone(existing), created: false };
      }
      option.values.push(payload);
      return { value: clone(payload), created: true };
    },
    createVariantAdmin: async (input) => {
      const id = nextId('variant');
      storeRef.current.variants.push({
        id,
        productId: input.productId,
        sku: input.sku ?? undefined,
        price: null,
        stockQuantity: input.stockQuantity ?? null,
        availability: input.availability as VariantAvailability,
        isActive: input.isActive,
        isDefault: input.isDefault,
        displayOrder: input.displayOrder ?? 0,
        finishName: '',
        images: [],
      });
      return { id };
    },
    updateVariantAdmin: async (id, updates) => {
      const variant = storeRef.current.variants.find((item) => item.id === id);
      if (!variant) throw new Error('Variant not found.');
      if ('sku' in updates) variant.sku = updates.sku ?? undefined;
      if ('stock_quantity' in updates) {
        variant.stockQuantity = updates.stock_quantity ?? null;
      }
      if (updates.availability) variant.availability = updates.availability;
      if (typeof updates.is_active === 'boolean') {
        variant.isActive = updates.is_active;
      }
      if (typeof updates.is_default === 'boolean') {
        variant.isDefault = updates.is_default;
      }
      if (typeof updates.display_order === 'number') {
        variant.displayOrder = updates.display_order;
      }
    },
    deleteVariantAdmin: async (id) => {
      storeRef.current.variants = storeRef.current.variants.filter(
        (variant) => variant.id !== id
      );
    },
    deleteVariantOptionValueAdmin: async (id) => {
      const option = ensureOption();
      const linked = storeRef.current.variants.some(
        (variant) => variant.optionValueId === id
      );
      if (linked) throw new Error('The finish value is still linked.');
      option.values = option.values.filter((value) => value.id !== id);
    },
    linkVariantOptionAdmin: async (variantId, optionId, optionValueId) => {
      const variant = storeRef.current.variants.find(
        (item) => item.id === variantId
      );
      const value = findValue(optionValueId);
      if (!variant || !value) throw new Error('Variant or finish value missing.');
      variant.optionId = optionId;
      variant.optionValueId = optionValueId;
      variant.finishName = value.name;
    },
    reorderVariantsAdmin: async (productId, orderedVariantIds) => {
      orderedVariantIds.forEach((id, index) => {
        const variant = storeRef.current.variants.find(
          (item) => item.id === id && item.productId === productId
        );
        if (variant) variant.displayOrder = index + 1;
      });
    },
    setDefaultVariantAdmin: async (productId, variantId) => {
      storeRef.current.variants.forEach((variant) => {
        if (variant.productId !== productId) return;
        variant.isDefault = variant.id === variantId;
      });
    },
    syncVariantImagesAdmin: async (
      variantId,
      desired,
      baseline,
      removedIds
    ) => {
      const variant = storeRef.current.variants.find(
        (item) => item.id === variantId
      );
      if (!variant) throw new Error('Variant not found.');
      const removed = new Set(removedIds);
      variant.images = variant.images.filter(
        (image) => !removed.has(image.id)
      );
      const nextImages: ProductVariantImage[] = [];
      desired.forEach((image) => {
        const existing = variant.images.find(
          (row) =>
            (image.id && row.id === image.id) ||
            (!image.id && row.imageUrl === image.imageUrl)
        );
        if (existing) {
          existing.altText = image.altText;
          existing.sortOrder = image.sortOrder;
          existing.isPrimary = image.isPrimary;
          nextImages.push(existing);
          return;
        }
        const created: ProductVariantImage = {
          id: nextId('image'),
          variantId,
          imageUrl: image.imageUrl,
          altText: image.altText,
          sortOrder: image.sortOrder,
          isPrimary: image.isPrimary,
        };
        nextImages.push(created);
      });
      variant.images = nextImages;
      return { saved: clone(nextImages), failures: [] };
    },
    prepareImageUpload: async (file) =>
      ({
        file,
        originalSize: file.size,
        optimizedSize: file.size,
        savedBytes: 0,
        savedPercent: 0,
        originalWidth: 1000,
        originalHeight: 1000,
        width: 1000,
        height: 1000,
        sourceMimeType: file.type || 'image/png',
        mimeType: file.type || 'image/png',
        wasCompressed: false,
        warnings: [],
      }) as PreparedImage,
    uploadCatalogImage: (file) =>
      new Promise<string>((resolve, reject) => {
        const control = uploadControl.current;
        const url = `https://fake.local/${slugify(file.name)}.png`;
        if (control.failNext) {
          control.failNext = false;
          reject(
            new Error(
              'Storage upload failed (HTTP 500): simulated storage outage.'
            )
          );
          return;
        }
        if (control.hold) {
          control.pending.push({ url, resolve, reject });
          return;
        }
        resolve(url);
      }),
    deleteCatalogImageIfUnreferenced: async () => false,
  };
}

export function ProductVariantsHarness() {
  const editorRef = React.useRef<ProductVariantsEditorHandle | null>(null);
  const storeRef = React.useRef<FakeStore>({
    option: null,
    variants: [],
    sequence: 0,
    saveAttempts: 0,
  });
  const uploadControl = React.useRef<UploadControl>({
    hold: false,
    failNext: false,
    pending: [],
  });

  const services = React.useMemo(
    () => createFakeServices(storeRef, uploadControl),
    []
  );

  const [drafts, setDrafts] = React.useState<VariantDraftInput[]>([]);
  const [validationResult, setValidationResult] = React.useState('not run');
  const [saveResult, setSaveResult] = React.useState('not run');
  const [savedDb, setSavedDb] = React.useState('[]');
  const [saveAttempts, setSaveAttempts] = React.useState(0);
  const [holdUploads, setHoldUploads] = React.useState(false);
  const [failNextUpload, setFailNextUpload] = React.useState(false);

  React.useEffect(() => {
    uploadControl.current.hold = holdUploads;
  }, [holdUploads]);

  React.useEffect(() => {
    uploadControl.current.failNext = failNextUpload;
  }, [failNextUpload]);

  const refreshSavedDb = React.useCallback(() => {
    setSavedDb(JSON.stringify(snapshotOf(storeRef.current)));
    setSaveAttempts(storeRef.current.saveAttempts);
  }, []);

  const handleValidate = () => {
    const result = editorRef.current?.validate();
    setValidationResult(result?.banner ?? 'accepted');
  };

  const handleSave = async () => {
    const validation = editorRef.current?.validate();
    if (validation?.banner) {
      setSaveResult(`blocked: ${validation.banner}`);
      return;
    }
    const failures = (await editorRef.current?.sync(PRODUCT_ID)) ?? [];
    setSaveResult(failures.length > 0 ? `failed: ${failures[0]}` : 'saved');
    refreshSavedDb();
  };

  const releaseUploads = () => {
    setHoldUploads(false);
    uploadControl.current.hold = false;
    const pending = uploadControl.current.pending.splice(0);
    pending.forEach((upload) => upload.resolve(upload.url));
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-semibold">Product Variants Harness</h1>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="product-validate"
          className="rounded border px-3 py-1.5 text-sm"
          onClick={handleValidate}
        >
          Validate product
        </button>
        <button
          type="button"
          data-testid="product-save"
          className="rounded border px-3 py-1.5 text-sm"
          onClick={() => void handleSave()}
        >
          Save product
        </button>
        <button
          type="button"
          data-testid="release-uploads"
          className="rounded border px-3 py-1.5 text-sm"
          onClick={releaseUploads}
        >
          Release uploads
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            data-testid="hold-uploads"
            checked={holdUploads}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              uploadControl.current.hold = checked;
              setHoldUploads(checked);
            }}
          />
          Hold image uploads
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            data-testid="fail-next-upload"
            checked={failNextUpload}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              uploadControl.current.failNext = checked;
              setFailNextUpload(checked);
            }}
          />
          Fail next image upload
        </label>
      </div>

      <dl className="space-y-1 text-xs">
        <div>
          <dt className="font-semibold">Validation</dt>
          <dd data-testid="validation-result">{validationResult}</dd>
        </div>
        <div>
          <dt className="font-semibold">Save</dt>
          <dd data-testid="save-result">{saveResult}</dd>
        </div>
        <div>
          <dt className="font-semibold">Editor drafts</dt>
          <dd data-testid="editor-drafts">{JSON.stringify(drafts)}</dd>
        </div>
        <div>
          <dt className="font-semibold">Saved fake database</dt>
          <dd data-testid="saved-db">{savedDb}</dd>
        </div>
        <div>
          <dt className="font-semibold">Save attempts</dt>
          <dd data-testid="save-attempts">{saveAttempts}</dd>
        </div>
      </dl>

      <ProductVariantsEditor
        ref={editorRef}
        productId={PRODUCT_ID}
        services={services}
        onDraftsChange={setDrafts}
      />
    </div>
  );
}
