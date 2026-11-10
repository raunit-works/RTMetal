'use client';

import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBytes, type ImagePurpose } from '@/lib/images/image-config';

export type ImageUploadStage =
  | 'preparing'
  | 'compressing'
  | 'ready'
  | 'uploading'
  | 'uploaded'
  | 'failed'
  | 'cancelled';

export type ImageUploadTarget =
  | 'category'
  | 'product-main'
  | 'product-gallery'
  | 'service'
  | 'testimonial'
  | 'before-after'
  | 'metal-finish';

export interface ImageUploadItem {
  id: string;
  target: ImageUploadTarget;
  purpose: ImagePurpose;
  fileName: string;
  status: ImageUploadStage;
  progress: number;
  originalSize: number;
  optimizedSize?: number;
  previewUrl?: string;
  error?: string;
}

const STAGE_LABELS: Record<ImageUploadStage, string> = {
  preparing: 'Preparing',
  compressing: 'Compressing',
  ready: 'Ready',
  uploading: 'Uploading',
  uploaded: 'Uploaded',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const ACTIVE_STAGES: ImageUploadStage[] = ['preparing', 'compressing', 'ready', 'uploading'];

export function isImageUploadActive(item: ImageUploadItem): boolean {
  return ACTIVE_STAGES.includes(item.status);
}

function StageIcon({ status }: { status: ImageUploadStage }) {
  if (status === 'uploaded') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />;
  }
  if (status === 'failed') {
    return <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />;
  }
  if (status === 'cancelled') {
    return <X className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
  }
  if (status === 'uploading') {
    return <Upload className="h-4 w-4 text-gold-deep" aria-hidden="true" />;
  }
  return <Loader2 className="h-4 w-4 animate-spin text-gold-deep" aria-hidden="true" />;
}

export function ImageUploadStatusCard({
  item,
  onCancel,
  onRetry,
  onDismiss,
}: {
  item: ImageUploadItem;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onDismiss?: (id: string) => void;
}) {
  const active = isImageUploadActive(item);
  const savedPercent =
    item.optimizedSize && item.originalSize > 0
      ? Math.round((1 - item.optimizedSize / item.originalSize) * 1000) / 10
      : null;

  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 text-xs">
      <div className="flex items-start gap-3">
        {item.previewUrl ? (
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.previewUrl}
              alt={`Preview of ${item.fileName}`}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-medium text-foreground" title={item.fileName}>
              {item.fileName}
            </p>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                item.status === 'uploaded' && 'bg-emerald-500/10 text-emerald-700',
                item.status === 'failed' && 'bg-destructive/10 text-destructive',
                item.status === 'cancelled' && 'bg-muted text-muted-foreground',
                active && 'bg-gold/15 text-gold-deep'
              )}
            >
              <StageIcon status={item.status} />
              {STAGE_LABELS[item.status]}
            </span>
          </div>

          <p className="text-muted-foreground">
            Original {formatBytes(item.originalSize)}
            {item.optimizedSize !== undefined && (
              <>
                {' → '}Optimized {formatBytes(item.optimizedSize)}
                {savedPercent !== null && savedPercent > 0 && ` · Saved ${savedPercent}%`}
              </>
            )}
          </p>

          {active && (
            <div className="space-y-1">
              {item.status === 'compressing' ? (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gold transition-[width] duration-300"
                    style={{ width: `${Math.max(2, Math.min(100, item.progress))}%` }}
                  />
                </div>
              ) : (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-gold" />
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                {item.status === 'compressing'
                  ? 'Compression progress (not upload progress)'
                  : 'Waiting for the storage upload to complete'}
              </p>
            </div>
          )}

          {item.error && <p className="text-destructive">{item.error}</p>}
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          {active && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(item.id)}
              className="rounded-md border border-border p-1 text-muted-foreground hover:bg-muted"
              aria-label={`Cancel upload of ${item.fileName}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {!active && onRetry && (item.status === 'failed' || item.status === 'cancelled') && (
            <button
              type="button"
              onClick={() => onRetry(item.id)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </button>
          )}
          {!active && onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="rounded-md border border-border p-1 text-muted-foreground hover:bg-muted"
              aria-label={`Dismiss status for ${item.fileName}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ImageUploadStatusList({
  items,
  onCancel,
  onRetry,
  onDismiss,
}: {
  items: ImageUploadItem[];
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onDismiss?: (id: string) => void;
}) {
  if (items.length === 0) return null;

  const completed = items.filter((item) => !isImageUploadActive(item)).length;
  const uploaded = items.filter((item) => item.status === 'uploaded').length;
  const failed = items.filter((item) => item.status === 'failed').length;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span>
          {completed} of {items.length} processed
        </span>
        {uploaded > 0 && <span className="text-emerald-700">{uploaded} uploaded</span>}
        {failed > 0 && <span className="text-destructive">{failed} failed</span>}
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <ImageUploadStatusCard
            key={item.id}
            item={item}
            onCancel={onCancel}
            onRetry={onRetry}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
}
