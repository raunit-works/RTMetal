'use client';

import * as React from 'react';
import { Loader2, Upload, X } from 'lucide-react';
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

const IMAGE_PURPOSE = 'before-after' as const;
const IMAGE_TARGET = 'before-after' as const;

function createUploadId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function TransformationImageUploader({
  label,
  description,
  value,
  onChange,
  onUploaded,
  disabled,
  required,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  onUploaded?: (url: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const [upload, setUpload] = React.useState<ImageUploadItem | null>(null);
  const [busy, setBusy] = React.useState(false);
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

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? ' *' : ''}
      </Label>
      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="https://… or upload an image"
          disabled={disabled}
        />
        <label
          className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-medium hover:bg-muted ${
            disabled || busy ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
            className="hidden"
            disabled={disabled || busy}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (file) void runUpload(file);
            }}
          />
        </label>
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
      {value && (
        <div className="relative h-28 w-full overflow-hidden rounded-xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={`${label} preview`} className="h-full w-full object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label={`Remove ${label.toLowerCase()}`}
              className="absolute right-2 top-2 rounded-md bg-background/80 p-1 text-muted-foreground hover:bg-background hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AdditionalImagesUploader({
  values,
  onAdd,
  onRemove,
  onUploaded,
  disabled,
  max = 8,
}: {
  values: string[];
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
  onUploaded?: (url: string) => void;
  disabled?: boolean;
  max?: number;
}) {
  const [uploads, setUploads] = React.useState<ImageUploadItem[]>([]);
  const sourcesRef = React.useRef<Map<string, File>>(new Map());
  const controllersRef = React.useRef<Map<string, AbortController>>(new Map());
  const previewsRef = React.useRef<Set<string>>(new Set());
  const mountedRef = React.useRef(true);
  const busyCount = uploads.filter(isImageUploadActive).length;

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
    return () => {
      mountedRef.current = false;
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
      previews.forEach((url) => URL.revokeObjectURL(url));
      previews.clear();
      sources.clear();
    };
  }, []);

  const updateUpload = (id: string, patch: Partial<ImageUploadItem>) => {
    if (!mountedRef.current) return;
    setUploads((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const processUpload = async (id: string, file: File, controller: AbortController) => {
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

      onAdd(publicUrl);
      onUploaded?.(publicUrl);
      updateUpload(id, { status: 'uploaded', previewUrl: publicUrl });
      sourcesRef.current.delete(id);
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
    }
  };

  const handleFiles = async (files: File[]) => {
    if (disabled || files.length === 0) return;
    const remaining = Math.max(0, max - values.length);
    const selected = files.slice(0, remaining);
    if (selected.length === 0) return;

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
      await processUpload(id, file, controller);
    });
  };

  const retry = (id: string) => {
    const file = sourcesRef.current.get(id);
    if (!file || controllersRef.current.has(id)) return;
    const controller = new AbortController();
    controllersRef.current.set(id, controller);
    updateUpload(id, { status: 'preparing', progress: 0, error: undefined });
    void processUpload(id, file, controller);
  };

  const dismiss = (id: string) => {
    const item = uploads.find((entry) => entry.id === id);
    if (!item || isImageUploadActive(item)) return;
    releasePreview(item.previewUrl);
    sourcesRef.current.delete(id);
    setUploads((current) => current.filter((entry) => entry.id !== id));
  };

  return (
    <div className="space-y-2">
      <Label>Additional Images</Label>
      <p className="text-[11px] text-muted-foreground">
        Optional detail shots. Up to {max} images. {values.length}/{max} added.
      </p>
      <label
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-medium hover:bg-muted ${
          disabled || values.length >= max ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        {busyCount > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Add Images
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
          className="hidden"
          disabled={disabled || values.length >= max}
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = '';
            void handleFiles(files);
          }}
        />
      </label>

      {values.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {values.map((url) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Additional project" className="h-full w-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemove(url)}
                  aria-label="Remove additional image"
                  className="absolute right-1 top-1 rounded-md bg-background/85 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
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
