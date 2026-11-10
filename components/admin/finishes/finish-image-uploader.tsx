'use client';

import * as React from 'react';
import {
  ArrowDown,
  ArrowUp,
  ImageOff,
  Loader2,
  Replace,
  Upload,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ImageUploadStatusCard,
  ImageUploadStatusList,
  isImageUploadActive,
  type ImageUploadItem,
} from '@/components/admin/image-upload-status';
import {
  ImagePreparationError,
  getImageErrorMessage,
  prepareImageUpload,
} from '@/lib/images/prepare-image-upload';
import {
  deleteCatalogImageIfUnreferenced,
  uploadCatalogImage,
} from '@/lib/supabase/admin-catalog';
import { COMPRESSION_CONCURRENCY } from '@/lib/images/image-config';
import { runWithConcurrency } from '@/lib/images/concurrency';

const IMAGE_PURPOSE = 'metal-finish' as const;
const IMAGE_TARGET = 'metal-finish' as const;
const ACCEPTED_TYPES =
  'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif';

function createUploadId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function FinishMainImageUploader({
  value,
  onChange,
  onUploaded,
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  onUploaded?: (url: string) => void;
  disabled?: boolean;
}) {
  const [upload, setUpload] = React.useState<ImageUploadItem | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const sourceRef = React.useRef<File | null>(null);
  const controllerRef = React.useRef<AbortController | null>(null);
  const previewRef = React.useRef<string | null>(null);
  const mountedRef = React.useRef(true);

  const releasePreview = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
  };

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
      controllerRef.current = null;
      releasePreview();
    };
  }, []);

  const updateUpload = (id: string, patch: Partial<ImageUploadItem>) => {
    if (!mountedRef.current) return;
    setUpload((current) => (current?.id === id ? { ...current, ...patch } : current));
  };

  const runUpload = async (file: File) => {
    if (busy || disabled) return;
    let uploadedUrl: string | null = null;
    sourceRef.current = file;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const id = createUploadId();

    releasePreview();
    setBusy(true);
    setUpload({
      id,
      target: IMAGE_TARGET,
      purpose: IMAGE_PURPOSE,
      fileName: file.name,
      status: 'preparing',
      progress: 0,
      originalSize: file.size,
    });

    try {
      updateUpload(id, { status: 'compressing', progress: 1 });
      const prepared = await prepareImageUpload(file, IMAGE_PURPOSE, {
        signal: controller.signal,
        onProgress: (progress) =>
          updateUpload(id, { status: 'compressing', progress }),
      });

      if (controller.signal.aborted) {
        throw new ImagePreparationError('cancelled', 'Image upload cancelled.');
      }

      const preview = URL.createObjectURL(prepared.file);
      previewRef.current = preview;
      updateUpload(id, {
        status: 'ready',
        progress: 100,
        optimizedSize: prepared.optimizedSize,
        previewUrl: preview,
      });

      updateUpload(id, { status: 'uploading' });
      const publicUrl = await uploadCatalogImage(prepared.file);
      uploadedUrl = publicUrl;

      if (controller.signal.aborted) {
        throw new ImagePreparationError('cancelled', 'Image upload cancelled.');
      }

      onChange(publicUrl);
      onUploaded?.(publicUrl);
      updateUpload(id, { status: 'uploaded', previewUrl: publicUrl });
      sourceRef.current = null;
      releasePreview();
    } catch (error: unknown) {
      const cancelled =
        controller.signal.aborted ||
        (error instanceof ImagePreparationError && error.code === 'cancelled');
      if (uploadedUrl) {
        void deleteCatalogImageIfUnreferenced(uploadedUrl);
      }
      updateUpload(id, {
        status: cancelled ? 'cancelled' : 'failed',
        error: cancelled ? 'Image upload cancelled.' : getImageErrorMessage(error),
      });
    } finally {
      controllerRef.current = null;
      if (mountedRef.current) setBusy(false);
    }
  };

  const dismiss = (id: string) => {
    if (upload?.id !== id || isImageUploadActive(upload)) return;
    releasePreview();
    setUpload(null);
    sourceRef.current = null;
  };

  const dropHandlers = {
    onDragEnter: (event: React.DragEvent) => {
      event.preventDefault();
      if (!disabled && !busy) setDragActive(true);
    },
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      if (!disabled && !busy) setDragActive(true);
    },
    onDragLeave: (event: React.DragEvent) => {
      event.preventDefault();
      setDragActive(false);
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      setDragActive(false);
      if (disabled || busy) return;
      const file = event.dataTransfer.files?.[0];
      if (file) void runUpload(file);
    },
  };

  return (
    <div className="space-y-2">
      <Label>Main Finish Image *</Label>
      <p className="text-[11px] text-muted-foreground">
        Primary image shown on the public finish card. Drag and drop, upload or paste a URL.
      </p>

      <div
        {...dropHandlers}
        className={`rounded-xl border border-dashed p-3 transition-colors ${
          dragActive
            ? 'border-gold bg-gold/5'
            : 'border-border bg-background/40 hover:border-gold/50'
        }`}
      >
        {value ? (
          <div className="relative mb-2 h-40 w-full overflow-hidden rounded-lg border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Main finish preview" className="h-full w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange('')}
                aria-label="Remove main finish image"
                className="absolute right-2 top-2 rounded-md bg-background/85 p-1 text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="mb-2 flex h-24 items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/30 text-xs text-muted-foreground">
            <ImageOff className="h-4 w-4" />
            No main image yet
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <label
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-medium hover:bg-muted ${
              disabled || busy ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {value ? 'Replace Image' : 'Upload Image'}
            <input
              type="file"
              accept={ACCEPTED_TYPES}
              className="hidden"
              disabled={disabled || busy}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                if (file) void runUpload(file);
              }}
            />
          </label>

          <Input
            value={value}
            onChange={(event) => onChange(event.currentTarget.value)}
            placeholder="https://… or /images/…"
            disabled={disabled || busy}
            className="min-w-[160px] flex-1"
          />
        </div>

        <p className="mt-2 text-[10px] text-muted-foreground">
          JPG, PNG, WebP, AVIF, HEIC or HEIF. Images are compressed to WebP before upload.
        </p>
      </div>

      {upload && (
        <ImageUploadStatusCard
          item={upload}
          onCancel={(id) => {
            if (upload.id === id) controllerRef.current?.abort();
          }}
          onRetry={() => {
            const source = sourceRef.current;
            if (source && !busy) void runUpload(source);
          }}
          onDismiss={dismiss}
        />
      )}
    </div>
  );
}

export function FinishAdditionalImagesUploader({
  values,
  onAdd,
  onRemove,
  onMove,
  onReplace,
  onUploaded,
  disabled,
  max = 8,
}: {
  values: string[];
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
  onMove: (url: string, direction: 'up' | 'down') => void;
  onReplace: (previousUrl: string, nextUrl: string) => void;
  onUploaded?: (url: string) => void;
  disabled?: boolean;
  max?: number;
}) {
  const [uploads, setUploads] = React.useState<ImageUploadItem[]>([]);
  const [pendingCount, setPendingCount] = React.useState(0);
  const pendingSlotsRef = React.useRef(0);
  const sourcesRef = React.useRef<Map<string, File>>(new Map());
  const controllersRef = React.useRef<Map<string, AbortController>>(new Map());
  const replaceTargetsRef = React.useRef<Map<string, string>>(new Map());
  const previewsRef = React.useRef<Set<string>>(new Set());
  const mountedRef = React.useRef(true);
  const busyCount = uploads.filter(isImageUploadActive).length;
  const usedCount = values.length + pendingCount;
  const atLimit = usedCount >= max;

  const reserveSlots = (count: number) => {
    if (count <= 0) return;
    pendingSlotsRef.current += count;
    setPendingCount(pendingSlotsRef.current);
  };

  const releaseSlot = () => {
    pendingSlotsRef.current = Math.max(0, pendingSlotsRef.current - 1);
    setPendingCount(pendingSlotsRef.current);
  };

  const availableSlots = () =>
    Math.max(0, max - values.length - pendingSlotsRef.current);

  const releasePreview = (url?: string) => {
    if (!url || !url.startsWith('blob:')) return;
    if (!previewsRef.current.has(url)) return;
    URL.revokeObjectURL(url);
    previewsRef.current.delete(url);
  };

  React.useEffect(() => {
    mountedRef.current = true;
    const controllers = controllersRef.current;
    const previews = previewsRef.current;
    const sources = sourcesRef.current;
    const replaceTargets = replaceTargetsRef.current;
    return () => {
      mountedRef.current = false;
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
      previews.forEach((url) => URL.revokeObjectURL(url));
      previews.clear();
      sources.clear();
      replaceTargets.clear();
    };
  }, []);

  const updateUpload = (id: string, patch: Partial<ImageUploadItem>) => {
    if (!mountedRef.current) return;
    setUploads((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const processUpload = async (
    id: string,
    file: File,
    controller: AbortController,
    replaceUrl?: string,
    reservedSlot = false
  ) => {
    let uploadedUrl: string | null = null;
    try {
      updateUpload(id, { status: 'compressing', progress: 1 });
      const prepared = await prepareImageUpload(file, IMAGE_PURPOSE, {
        signal: controller.signal,
        onProgress: (progress) =>
          updateUpload(id, { status: 'compressing', progress }),
      });

      if (controller.signal.aborted) {
        throw new ImagePreparationError('cancelled', 'Image upload cancelled.');
      }

      const preview = URL.createObjectURL(prepared.file);
      previewsRef.current.add(preview);
      updateUpload(id, {
        status: 'ready',
        progress: 100,
        optimizedSize: prepared.optimizedSize,
        previewUrl: preview,
      });

      updateUpload(id, { status: 'uploading' });
      const publicUrl = await uploadCatalogImage(prepared.file);
      uploadedUrl = publicUrl;

      if (controller.signal.aborted) {
        throw new ImagePreparationError('cancelled', 'Image upload cancelled.');
      }

      if (replaceUrl) {
        onReplace(replaceUrl, publicUrl);
      } else {
        onAdd(publicUrl);
      }
      onUploaded?.(publicUrl);
      updateUpload(id, { status: 'uploaded', previewUrl: publicUrl });
      sourcesRef.current.delete(id);
      replaceTargetsRef.current.delete(id);
      releasePreview(preview);
    } catch (error: unknown) {
      const cancelled =
        controller.signal.aborted ||
        (error instanceof ImagePreparationError && error.code === 'cancelled');
      if (uploadedUrl) {
        void deleteCatalogImageIfUnreferenced(uploadedUrl);
      }
      updateUpload(id, {
        status: cancelled ? 'cancelled' : 'failed',
        error: cancelled ? 'Image upload cancelled.' : getImageErrorMessage(error),
      });
    } finally {
      controllersRef.current.delete(id);
      if (reservedSlot) releaseSlot();
    }
  };

  const startUpload = (file: File, replaceUrl?: string) => {
    const id = createUploadId();
    sourcesRef.current.set(id, file);
    if (replaceUrl) replaceTargetsRef.current.set(id, replaceUrl);
    setUploads((current) => [
      ...current,
      {
        id,
        target: IMAGE_TARGET,
        purpose: IMAGE_PURPOSE,
        fileName: file.name,
        status: 'preparing',
        progress: 0,
        originalSize: file.size,
      },
    ]);

    const controller = new AbortController();
    controllersRef.current.set(id, controller);
    void processUpload(id, file, controller, replaceUrl);
  };

  const handleFiles = async (files: File[]) => {
    if (disabled || files.length === 0) return;
    const selected = files.slice(0, availableSlots());
    if (selected.length === 0) return;

    reserveSlots(selected.length);
    const entries = selected.map((file) => {
      const id = createUploadId();
      sourcesRef.current.set(id, file);
      return { id, file };
    });

    setUploads((current) => [
      ...current,
      ...entries.map(({ id, file }) => ({
        id,
        target: IMAGE_TARGET,
        purpose: IMAGE_PURPOSE,
        fileName: file.name,
        status: 'preparing' as const,
        progress: 0,
        originalSize: file.size,
      })),
    ]);

    await runWithConcurrency(entries, COMPRESSION_CONCURRENCY, async ({ id, file }) => {
      const controller = new AbortController();
      controllersRef.current.set(id, controller);
      await processUpload(id, file, controller, undefined, true);
    });
  };

  const retry = (id: string) => {
    const file = sourcesRef.current.get(id);
    if (!file || controllersRef.current.has(id)) return;

    const replaceUrl = replaceTargetsRef.current.get(id);
    let reservedSlot = false;
    if (!replaceUrl) {
      if (availableSlots() <= 0) return;
      reserveSlots(1);
      reservedSlot = true;
    }

    const controller = new AbortController();
    controllersRef.current.set(id, controller);
    updateUpload(id, { status: 'preparing', progress: 0, error: undefined });
    void processUpload(id, file, controller, replaceUrl, reservedSlot);
  };

  const dismiss = (id: string) => {
    const item = uploads.find((entry) => entry.id === id);
    if (!item || isImageUploadActive(item)) return;
    releasePreview(item.previewUrl);
    sourcesRef.current.delete(id);
    replaceTargetsRef.current.delete(id);
    setUploads((current) => current.filter((entry) => entry.id !== id));
  };

  return (
    <div className="space-y-2">
      <Label>Additional Related Images</Label>
      <p className="text-[11px] text-muted-foreground">
        Optional detail shots. Up to {max} images. {usedCount}/{max} added
        {pendingCount > 0 ? ` (${pendingCount} uploading)` : ''}.
      </p>
      <label
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-medium hover:bg-muted ${
          disabled || atLimit ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        {busyCount > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Add Images
        <input
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="hidden"
          disabled={disabled || atLimit}
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = '';
            void handleFiles(files);
          }}
        />
      </label>

      {values.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {values.map((url, index) => (
            <div
              key={url}
              className="group relative overflow-hidden rounded-xl border border-border bg-muted"
            >
              <div className="aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Additional finish ${index + 1}`} className="h-full w-full object-cover" />
              </div>
              {!disabled && (
                <>
                  <button
                    type="button"
                    onClick={() => onRemove(url)}
                    aria-label="Remove additional image"
                    className="absolute right-1 top-1 rounded-md bg-background/85 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => onMove(url, 'up')}
                        disabled={index === 0}
                        aria-label="Move image earlier"
                        className="rounded-md bg-background/85 p-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMove(url, 'down')}
                        disabled={index === values.length - 1}
                        aria-label="Move image later"
                        className="rounded-md bg-background/85 p-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                    <label
                      className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-background/85 px-1.5 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                      title="Replace image"
                    >
                      <Replace className="h-3 w-3" />
                      Replace
                      <input
                        type="file"
                        accept={ACCEPTED_TYPES}
                        className="hidden"
                        disabled={disabled || busyCount > 0}
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          event.currentTarget.value = '';
                          if (file) startUpload(file, url);
                        }}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ImageUploadStatusList
        items={uploads}
        onCancel={(id) => controllersRef.current.get(id)?.abort()}
        onRetry={retry}
        onDismiss={dismiss}
      />
    </div>
  );
}
