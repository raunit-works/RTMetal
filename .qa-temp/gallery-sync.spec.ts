import { expect, test } from '@playwright/test';
import type { ProductImage } from '../lib/types';
import { runWithConcurrency } from '../lib/images/concurrency';
import { copySelectedFilesAndReset } from '../lib/images/file-selection';
import {
  mergeGallerySyncResult,
  syncProductGalleryImages,
  type GalleryOperations,
} from '../lib/supabase/product-gallery';

function image(
  id: string,
  imageUrl: string,
  sortOrder: number,
  altText = '',
  isPrimary = false
): ProductImage {
  return { id, productId: 'product-1', imageUrl, altText, sortOrder, isPrimary };
}

function createOperations() {
  const calls = {
    added: [] as Array<{ productId: string; imageUrl: string; sortOrder: number }>,
    updated: [] as Array<{ id: string; sortOrder: number; altText: string; isPrimary: boolean }>,
    removed: [] as string[],
  };
  let nextId = 100;

  const operations: GalleryOperations = {
    async add(productId, imageUrl, altText, isPrimary, sortOrder) {
      calls.added.push({ productId, imageUrl, sortOrder: sortOrder ?? 0 });
      return image(String(nextId++), imageUrl, sortOrder ?? 0, altText ?? '', isPrimary);
    },
    async update(id, updates) {
      calls.updated.push({
        id,
        sortOrder: updates.sort_order ?? 0,
        altText: updates.alt_text ?? '',
        isPrimary: updates.is_primary ?? false,
      });
      return image(id, `https://cdn/${id}.jpg`, updates.sort_order ?? 0, updates.alt_text ?? '', updates.is_primary);
    },
    async remove(id) {
      calls.removed.push(id);
    },
  };

  return { operations, calls };
}

test('persists reorder, updates and explicit deletes only', async () => {
  const existing = [
    image('a', 'https://cdn/a.jpg', 0, 'A'),
    image('b', 'https://cdn/b.jpg', 1, 'B'),
    image('c', 'https://cdn/c.jpg', 2, 'C'),
  ];
  const desired = [
    { ...existing[2], sortOrder: 0, isPrimary: true, altText: 'C updated' },
    { ...existing[0], sortOrder: 2 },
  ];
  const { operations, calls } = createOperations();

  const result = await syncProductGalleryImages('product-1', desired, existing, {
    operations,
    removedIds: ['b'],
  });

  expect(calls.added).toHaveLength(0);
  expect(calls.removed).toEqual(['b']);
  expect(calls.updated).toEqual([
    { id: 'c', sortOrder: 0, altText: 'C updated', isPrimary: true },
    { id: 'a', sortOrder: 2, altText: 'A', isPrimary: false },
  ]);
  expect(result.failures).toEqual([]);
  expect(result.deletedIds).toEqual(['b']);
  expect(result.savedImages.map((item) => item.id)).toEqual(['c', 'a']);
});

test('adds new gallery images once and returns their persisted ids', async () => {
  const existing = [image('a', 'https://cdn/a.jpg', 0)];
  const desired = [
    existing[0],
    image('', 'https://staging.supabase.co/storage/v1/object/public/catalog/new-1.jpg', 1),
    image('', 'https://staging.supabase.co/storage/v1/object/public/catalog/new-2.jpg', 2),
  ];
  const { operations, calls } = createOperations();

  const result = await syncProductGalleryImages('product-1', desired, existing, { operations });

  expect(calls.added).toHaveLength(2);
  expect(calls.removed).toHaveLength(0);
  expect(result.failures).toEqual([]);
  expect(result.added.map((item) => item.id)).toEqual(['100', '101']);
  expect(result.savedImages.map((item) => item.id)).toEqual(['a', '100', '101']);
});

test('does not duplicate a URL that already exists in the saved gallery', async () => {
  const existing = [image('a', 'https://cdn/a.jpg', 0)];
  const { operations, calls } = createOperations();

  const result = await syncProductGalleryImages(
    'product-1',
    [image('', 'https://cdn/a.jpg', 0)],
    existing,
    { operations }
  );

  expect(calls.added).toHaveLength(0);
  expect(calls.removed).toHaveLength(0);
  expect(result.failures).toEqual([]);
  expect(result.savedImages.map((item) => item.id)).toEqual(['a']);
});

test('reports partial failures without hiding saved rows', async () => {
  const existing = [
    image('a', 'https://cdn/a.jpg', 0),
    image('b', 'https://cdn/b.jpg', 1),
  ];
  const { operations } = createOperations();
  operations.remove = async (id) => {
    if (id === 'b') throw new Error('delete blocked');
  };

  const result = await syncProductGalleryImages(
    'product-1',
    [existing[0]],
    existing,
    { operations, removedIds: ['b'] }
  );

  expect(result.deletedIds).toEqual([]);
  expect(result.failures).toHaveLength(1);
  expect(result.failures[0].imageId).toBe('b');
  expect(result.savedImages.map((item) => item.id)).toEqual(['a', 'b']);
});

test('rejects invalid image URLs instead of persisting them', async () => {
  const { operations, calls } = createOperations();

  const result = await syncProductGalleryImages(
    'product-1',
    [image('', 'not-a-url', 0), image('', '', 1)],
    [],
    { operations }
  );

  expect(calls.added).toHaveLength(0);
  expect(result.failures).toHaveLength(2);
  expect(result.savedImages).toEqual([]);
});

test('merges persisted ids and keeps failed edits retryable', async () => {
  const desired = [image('a', 'https://cdn/a.jpg', 0, 'A'), image('', 'https://cdn/new.jpg', 1)];
  const result = {
    savedImages: [image('a', 'https://cdn/a.jpg', 0, 'A')],
    added: [image('100', 'https://cdn/new.jpg', 1)],
    updated: [],
    deletedIds: [],
    failures: [],
  };

  const merged = mergeGallerySyncResult(desired, result);

  expect(merged.map((item) => item.id)).toEqual(['a', '100']);

  const failedUpdate = mergeGallerySyncResult(
    [{ ...desired[0], altText: 'Changed' }],
    {
      savedImages: [image('a', 'https://cdn/a.jpg', 0, 'A')],
      added: [],
      updated: [],
      deletedIds: [],
      failures: [{ imageId: 'a', message: 'update failed' }],
    }
  );

  expect(failedUpdate[0].altText).toBe('Changed');
});

test('never deletes saved rows unless their ids were explicitly removed', async () => {
  const existing = [
    image('a', 'https://cdn/a.jpg', 0),
    image('b', 'https://cdn/b.jpg', 1),
    image('c', 'https://cdn/c.jpg', 2),
  ];
  const { operations, calls } = createOperations();

  const result = await syncProductGalleryImages(
    'product-1',
    [existing[0]],
    existing,
    { operations }
  );

  expect(calls.removed).toEqual([]);
  expect(result.savedImages.map((item) => item.id)).toEqual(['a', 'b', 'c']);
});

test('copies a FileList before clearing the file input', () => {
  const selected = [
    { name: 'first.jpg' },
    { name: 'second.jpg' },
  ] as unknown as FileList;
  let currentFiles: FileList = selected;
  const input = {
    get files() {
      return currentFiles;
    },
    get value() {
      return '';
    },
    set value(next: string) {
      if (next === '') currentFiles = [] as unknown as FileList;
    },
  } as unknown as HTMLInputElement;

  const copied = copySelectedFilesAndReset(input);

  expect(copied.map((file) => file.name)).toEqual(['first.jpg', 'second.jpg']);
  expect(input.files).toHaveLength(0);
});

test('bounded queue never exceeds its concurrency limit', async () => {
  const items = [1, 2, 3, 4, 5, 6];
  let active = 0;
  let maximumActive = 0;

  const results = await runWithConcurrency(items, 3, async (item) => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    await new Promise((resolve) => setTimeout(resolve, 10));
    active -= 1;
    return item * 2;
  });

  expect(maximumActive).toBe(3);
  expect(results).toEqual([2, 4, 6, 8, 10, 12]);
});
