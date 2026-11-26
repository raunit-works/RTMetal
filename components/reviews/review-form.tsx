'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { ImagePlus, Loader2, Smile, Star, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  REVIEW_CLIENT_LIMITS,
  countCodePoints,
  createSubmissionKey,
  getPhotoBudgetBytes,
  validateReviewForm,
  type ReviewFormErrors,
} from '@/lib/review/client-contract';
import {
  ReviewApiError,
  liveReviewApi,
  type ReviewApiAdapter,
} from '@/lib/review/api-client';
import { cn } from '@/lib/utils';

const RATING_LABELS = [
  '1 star — Poor',
  '2 stars — Fair',
  '3 stars — Good',
  '4 stars — Very good',
  '5 stars — Excellent',
] as const;

const EMOJIS = ['😀', '🙂', '😊', '😍', '👍', '🙏', '✨', '😐', '🙁', '😞', '👎', '💡'] as const;

export interface ReviewSubmissionProtection {
  active: boolean;
  uncertain: boolean;
}

interface PreparedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  sourceFingerprint: string;
  fingerprint: string;
}

interface SubmitErrorState {
  message: string;
  canRetry: boolean;
  locked: boolean;
  unavailable?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return 'shortly';
  if (seconds < 60) return `in ${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function describeSubmitError(error: unknown): SubmitErrorState {
  if (error instanceof ReviewApiError) {
    if (error.status === 400) {
      if (error.errors.length > 0) {
        return { message: 'Please check the highlighted fields.', canRetry: false, locked: false };
      }
      if (error.code === 'PRODUCT_NOT_PUBLIC') {
        return { message: 'This product is not available for reviews.', canRetry: false, locked: false };
      }
      return { message: 'Please review your submission and try again.', canRetry: true, locked: false };
    }
    if (error.status === 404) {
      return { message: 'This product is no longer available for reviews.', canRetry: false, locked: false };
    }
    if (error.status === 409) {
      if (error.code === 'SUBMISSION_STATUS_UNKNOWN') {
        return {
          message: 'Your submission could not be confirmed. Keep these details and retry safely.',
          canRetry: true,
          locked: true,
        };
      }
      return {
        message: 'This submission was already recorded with different details.',
        canRetry: false,
        locked: false,
      };
    }
    if (error.status === 413) {
      return {
        message: 'The combined upload is too large. Remove or compress a photo and try again.',
        canRetry: false,
        locked: false,
      };
    }
    if (error.status === 429) {
      return {
        message: `Too many submissions. Please try again ${formatDuration(error.retryAfter)}.`,
        canRetry: true,
        locked: false,
      };
    }
    if (error.status === 500) {
      return { message: 'We could not submit your review. Please try again.', canRetry: true, locked: false };
    }
    if (error.code === 'SUBMISSION_STATUS_UNKNOWN') {
      return {
        message: 'Your submission was received but its status is unconfirmed. Keep these details and retry safely.',
        canRetry: true,
        locked: true,
      };
    }
    if (error.code === 'RATE_LIMIT_UNAVAILABLE') {
      return {
        message: 'Review submissions are temporarily unavailable. Please try again shortly.',
        canRetry: false,
        locked: false,
        unavailable: true,
      };
    }
    if (error.status === 503 && error.code === 'REVIEWS_DISABLED') {
      return {
        message: 'Review submissions are not open yet.',
        canRetry: false,
        locked: false,
        unavailable: true,
      };
    }
    return {
      message: 'Review submissions are temporarily unavailable.',
      canRetry: false,
      locked: false,
      unavailable: true,
    };
  }

  return {
    message: 'Your connection interrupted the submission. Retry safely with the same details.',
    canRetry: true,
    locked: true,
  };
}

async function compressPhoto(file: File): Promise<File> {
  const { default: imageCompression } = await import('browser-image-compression');
  const compressed = await imageCompression(file, {
    maxSizeMB: REVIEW_CLIENT_LIMITS.maxOutputPhotoBytes / (1024 * 1024),
    maxWidthOrHeight: REVIEW_CLIENT_LIMITS.maxPhotoDimension,
    initialQuality: 0.85,
    useWebWorker: true,
    fileType: 'image/webp',
  });

  if (compressed.size > REVIEW_CLIENT_LIMITS.maxOutputPhotoBytes) {
    throw new Error('A compressed photo is still larger than 3 MB.');
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'review-photo';
  return new File([await compressed.arrayBuffer()], `${baseName}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  });
}

async function fingerprintFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  if (crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return `${Array.from(new Uint8Array(digest))
      .slice(0, 16)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')}-${file.size.toString(16)}`;
  }

  const view = new Uint8Array(bytes);
  let hash = 0x811c9dc5;
  view.forEach((byte) => {
    hash = Math.imul(hash ^ byte, 0x01000193);
  });
  return `${(hash >>> 0).toString(16).padStart(8, '0')}-${view.length.toString(16)}`;
}

function releasePhotos(photos: PreparedPhoto[]): void {
  photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
}

export function ReviewForm({
  productId,
  productName,
  api = liveReviewApi,
  onProtectionChange,
  onSuccess,
}: {
  productId: string;
  productName: string;
  api?: ReviewApiAdapter;
  onProtectionChange?: (protection: ReviewSubmissionProtection) => void;
  onSuccess: (duplicate: boolean) => Promise<void>;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [fieldErrors, setFieldErrors] = useState<ReviewFormErrors>({});
  const [photoError, setPhotoError] = useState('');
  const [compressionMessage, setCompressionMessage] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitErrorState | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<PreparedPhoto[]>([]);
  const submittingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const submissionKeyRef = useRef('');
  const attemptPayloadRef = useRef('');
  const indeterminateRef = useRef(false);
  const photoSequenceRef = useRef(0);
  const activeRef = useRef(true);
  const generationRef = useRef(0);
  const compressionRef = useRef(false);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      releasePhotos(photosRef.current);
    };
  }, []);

  const totalPhotoBytes = useMemo(
    () => photos.reduce((sum, photo) => sum + photo.size, 0),
    [photos]
  );
  const contentCodePoints = countCodePoints(content.trim());
  const isValid = Object.keys(
    validateReviewForm({ rating, customerName, content, totalPhotoBytes })
  ).length === 0;

  const clearFieldError = (field: keyof ReviewFormErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const payloadSignature = useCallback(
    () =>
      JSON.stringify({
        rating,
        content: content.trim(),
        customerName: customerName.trim(),
        photos: photos.map((photo) => photo.fingerprint),
      }),
    [content, customerName, photos, rating]
  );

  const ensureSubmissionKey = useCallback(() => {
    const signature = payloadSignature();
    if (!submissionKeyRef.current) {
      submissionKeyRef.current = createSubmissionKey();
      attemptPayloadRef.current = signature;
      indeterminateRef.current = false;
      return submissionKeyRef.current;
    }
    if (!indeterminateRef.current && attemptPayloadRef.current !== signature) {
      submissionKeyRef.current = createSubmissionKey();
      attemptPayloadRef.current = signature;
    }
    return submissionKeyRef.current;
  }, [payloadSignature]);

  const removePhoto = (id: string) => {
    const target = photos.find((photo) => photo.id === id);
    if (target) releasePhotos([target]);
    setPhotos((current) => current.filter((photo) => photo.id !== id));
    setPhotoError('');
    setCompressionMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addPhotos = async (fileList: FileList | null) => {
    const incoming = Array.from(fileList ?? []);
    if (incoming.length === 0) return;

    setPhotoError('');
    setCompressionMessage('');
    if (photosRef.current.length + incoming.length > REVIEW_CLIENT_LIMITS.maxPhotos) {
      setPhotoError('You can add up to 3 photos.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    compressionRef.current = true;
    setIsCompressing(true);
    const prepared: PreparedPhoto[] = [];
    try {
      let runningTotal = photosRef.current.reduce((sum, photo) => sum + photo.size, 0);
      for (const file of incoming) {
        if (!(REVIEW_CLIENT_LIMITS.allowedPhotoMimeTypes as readonly string[]).includes(file.type)) {
          throw new Error('Only JPEG, PNG and WebP photos are supported.');
        }
        if (file.size > REVIEW_CLIENT_LIMITS.maxSourcePhotoBytes) {
          throw new Error('Each source photo must be 3 MB or smaller.');
        }

        const sourceFingerprint = await fingerprintFile(file);
        if (!activeRef.current || generationRef.current !== generation) {
          releasePhotos(prepared);
          return;
        }
        if (
          photosRef.current.some((photo) => photo.sourceFingerprint === sourceFingerprint) ||
          prepared.some((photo) => photo.sourceFingerprint === sourceFingerprint)
        ) {
          setPhotoError('That photo is already attached.');
          continue;
        }

        const compressedFile = await compressPhoto(file);
        if (!activeRef.current || generationRef.current !== generation) {
          releasePhotos(prepared);
          return;
        }
        runningTotal += compressedFile.size;
        if (runningTotal > getPhotoBudgetBytes()) {
          throw new Error('Photos are too large for one submission. Remove or compress a photo.');
        }
        photoSequenceRef.current += 1;
        prepared.push({
          id: `photo-${photoSequenceRef.current}`,
          file: compressedFile,
          previewUrl: URL.createObjectURL(compressedFile),
          name: compressedFile.name,
          size: compressedFile.size,
          sourceFingerprint,
          fingerprint: await fingerprintFile(compressedFile),
        });
      }
      if (!activeRef.current || generationRef.current !== generation) {
        releasePhotos(prepared);
        return;
      }
      if (prepared.length > 0) {
        const next = [...photosRef.current, ...prepared];
        photosRef.current = next;
        setPhotos(next);
        setCompressionMessage(`${prepared.length} photo${prepared.length === 1 ? '' : 's'} ready.`);
      }
    } catch (error) {
      releasePhotos(prepared);
      setPhotoError(error instanceof Error ? error.message : 'This photo could not be prepared.');
    } finally {
      if (activeRef.current && generationRef.current === generation) {
        compressionRef.current = false;
        setIsCompressing(false);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;
    const next = `${content.slice(0, start)}${emoji}${content.slice(end)}`;
    setContent(next);
    clearFieldError('content');
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  const handleStarKeyDown = (event: KeyboardEvent<HTMLButtonElement>, value: number) => {
    let next = value;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = Math.min(5, value + 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = Math.max(1, value - 1);
    else if (event.key === 'Home') next = 1;
    else if (event.key === 'End') next = 5;
    else return;
    event.preventDefault();
    setRating(next);
    clearFieldError('rating');
    document.getElementById(`review-rating-${next}`)?.focus();
  };

  const submit = async () => {
    if (submittingRef.current || compressionRef.current) return;
    const validationErrors = validateReviewForm({ rating, customerName, content, totalPhotoBytes });
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await api.submitReview(
        {
          productId,
          rating: rating as number,
          content: content.trim(),
          customerName: customerName.trim(),
          submissionKey: ensureSubmissionKey(),
          photos: photosRef.current.map((photo) => photo.file),
        },
        controller.signal
      );
      await onSuccess(response.duplicate);
      releasePhotos(photosRef.current);
      photosRef.current = [];
      setRating(null);
      setCustomerName('');
      setContent('');
      setPhotos([]);
      setFieldErrors({});
      setSubmitError(null);
      submissionKeyRef.current = '';
      attemptPayloadRef.current = '';
      indeterminateRef.current = false;
    } catch (error) {
      const state = describeSubmitError(error);
      setSubmitError(state);
      indeterminateRef.current = state.locked;
      if (error instanceof ReviewApiError && error.errors.length > 0) {
        const nextErrors: ReviewFormErrors = {};
        error.errors.forEach((item) => {
          if (['rating', 'customerName', 'content', 'photos'].includes(item.field)) {
            nextErrors[item.field as keyof ReviewFormErrors] = item.message;
          }
        });
        setFieldErrors(nextErrors);
      }
    } finally {
      abortRef.current = null;
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const locked = Boolean(submitError?.locked);
  const unavailable = Boolean(submitError?.unavailable);
  const submitLabel = isSubmitting
    ? 'Publishing review…'
    : locked
      ? 'Retry safely with same details'
      : unavailable
        ? 'Review submissions unavailable'
        : submitError?.canRetry
          ? 'Try again'
          : 'Publish my review';

  useEffect(() => {
    onProtectionChange?.({
      active: isSubmitting || isCompressing,
      uncertain: locked,
    });
  }, [isCompressing, isSubmitting, locked, onProtectionChange]);

  return (
    <form data-testid="review-form" className="flex min-h-0 flex-1 flex-col overflow-hidden" onSubmit={(event) => {
      event.preventDefault();
      void submit();
    }}>
      <div data-testid="review-form-body" className="min-h-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-5 pt-1 sm:px-7 md:pb-6">
      <div className="space-y-3">
        <p className="type-label text-[#302D27]">Your rating</p>
        <div role="radiogroup" aria-label="Your rating" className="flex flex-wrap gap-1">
          {RATING_LABELS.map((label, index) => {
            const value = index + 1;
            const selected = rating !== null && value <= rating;
            return (
              <button
                key={value}
                id={`review-rating-${value}`}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={label}
                data-testid={`review-rating-${value}`}
                tabIndex={rating === value || (rating === null && value === 1) ? 0 : -1}
                disabled={locked || isSubmitting}
                onClick={() => {
                  setRating(value);
                  clearFieldError('rating');
                }}
                onKeyDown={(event) => handleStarKeyDown(event, value)}
                className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B18A53] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Star
                  className={cn(
                    'h-6 w-6 transition-colors',
                    selected ? 'fill-[#B18A53] text-[#B18A53]' : 'text-[#CFC8BC]'
                  )}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
        <p className="min-h-[16px] text-xs text-[#302D27]/60" aria-live="polite">
          {rating ? RATING_LABELS[rating - 1] : 'Select a star rating'}
        </p>
        {fieldErrors.rating && (
          <p className="text-xs font-medium text-[#9B2C2C]" role="alert">{fieldErrors.rating}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="review-customer-name" className="type-label text-[#302D27]">
          Your name <span className="font-normal text-[#302D27]/50">(optional)</span>
        </label>
        <Input
          id="review-customer-name"
          data-testid="review-name"
          value={customerName}
          disabled={locked || isSubmitting}
          maxLength={160}
          autoComplete="name"
          onChange={(event) => {
            setCustomerName(event.target.value);
            clearFieldError('customerName');
          }}
          placeholder="How should we credit you?"
          className="h-11 rounded-xl border-[#E3DDD3] bg-white"
        />
        {fieldErrors.customerName && (
          <p className="text-xs font-medium text-[#9B2C2C]" role="alert">{fieldErrors.customerName}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="review-content" className="type-label text-[#302D27]">
            Your review
          </label>
          <span data-testid="review-content-counter" className="numeric text-xs text-[#302D27]/55">
            {contentCodePoints} / {REVIEW_CLIENT_LIMITS.maxContentCodePoints}
          </span>
        </div>
        <div className="relative">
          <Textarea
            id="review-content"
            ref={textareaRef}
            data-testid="review-content"
            value={content}
            disabled={locked || isSubmitting}
            rows={5}
            onChange={(event) => {
              setContent(event.target.value);
              clearFieldError('content');
            }}
            placeholder="Share what you liked, what could be improved, and how you use it."
            className="min-h-[124px] resize-y rounded-xl border-[#E3DDD3] bg-white pr-12 leading-7"
          />
          <button
            type="button"
            data-testid="review-emoji-toggle"
            aria-label="Insert an emoji"
            aria-expanded={emojiOpen}
            disabled={locked || isSubmitting}
            onClick={() => setEmojiOpen((current) => !current)}
            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border border-[#E3DDD3] bg-[#FCFAF6] text-[#8B6A3E] hover:bg-[#F5EFE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B18A53]"
          >
            <Smile className="h-4 w-4" aria-hidden="true" />
          </button>
          {emojiOpen && (
            <div
              data-testid="review-emoji-panel"
              className="absolute bottom-12 right-0 z-10 grid w-[196px] grid-cols-6 gap-1 rounded-xl border border-[#E3DDD3] bg-white p-2 shadow-lg"
              onKeyDown={(event) => {
                if (event.key === 'Escape') setEmojiOpen(false);
              }}
            >
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`Insert ${emoji}`}
                  onClick={(event) => {
                    event.preventDefault();
                    insertEmoji(emoji);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-base hover:bg-[#F5EFE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B18A53]"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        {fieldErrors.content && (
          <p className="text-xs font-medium text-[#9B2C2C]" role="alert">{fieldErrors.content}</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="type-label text-[#302D27]">
            Photos <span className="font-normal text-[#302D27]/50">(optional)</span>
          </p>
          <span data-testid="review-photo-count" className="text-xs text-[#302D27]/55">
            {photos.length} / {REVIEW_CLIENT_LIMITS.maxPhotos}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: REVIEW_CLIENT_LIMITS.maxPhotos }, (_, index) => {
            const photo = photos[index];
            if (!photo) {
              return (
                <div
                  key={`empty-${index}`}
                  className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-[#D9D2C6] bg-[#FCFAF6] text-[#B6AC9C]"
                >
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                </div>
              );
            }
            return (
              <div
                key={photo.id}
                data-testid="review-photo-preview"
                className="relative aspect-square overflow-hidden rounded-xl border border-[#E3DDD3] bg-white"
              >
                <Image
                  src={photo.previewUrl}
                  alt={photo.name}
                  fill
                  unoptimized
                  sizes="120px"
                  className="object-cover"
                />
                <button
                  type="button"
                  data-testid="review-photo-remove"
                  aria-label={`Remove ${photo.name}`}
                  disabled={locked || isSubmitting}
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#302D27]/85 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
        <label className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-[#E3DDD3] bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#8B6A3E] hover:bg-[#F8F4ED] focus-within:ring-2 focus-within:ring-[#B18A53]">
          <span>{isCompressing ? 'Preparing photos…' : 'Add photos'}</span>
          <input
            ref={fileInputRef}
            data-testid="review-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={locked || isSubmitting || isCompressing || photos.length >= 3}
            onChange={(event) => void addPhotos(event.target.files)}
            className="sr-only"
          />
        </label>
        <input data-testid="review-website" name="website" value="" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" readOnly />
        <p data-testid="review-photo-status" className="min-h-[16px] text-xs text-[#302D27]/55" role="status" aria-live="polite">
          {isCompressing
            ? 'Compressing photos…'
            : compressionMessage || `JPEG, PNG or WebP. Up to 3 MB each; total upload stays under 4 MB.`}
        </p>
        {photoError && <p className="text-xs font-medium text-[#9B2C2C]" role="alert">{photoError}</p>}
        {fieldErrors.photos && <p className="text-xs font-medium text-[#9B2C2C]" role="alert">{fieldErrors.photos}</p>}
      </div>

      {submitError && (
        <div data-testid="review-submit-error" role="alert" className="rounded-xl border border-[#E4C7C7] bg-[#FDF4F4] p-3 text-sm text-[#7E2A2A]">
          <p>{submitError.message}</p>
          {locked && (
            <p className="mt-1 text-xs">Do not change these details before retrying.</p>
          )}
        </div>
      )}
      </div>

      <div data-testid="review-form-footer" className="shrink-0 border-t border-[#E3DDD3] bg-[#FCFAF6] px-5 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-3 sm:px-7 md:pb-5">
      <div className="space-y-2">
        <Button
          type="submit"
          data-testid="review-submit"
          disabled={!isValid || isSubmitting || isCompressing || unavailable}
          className="h-12 w-full rounded-full bg-[#302D27] text-white hover:bg-[#463F34] disabled:opacity-45"
        >
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {submitLabel}
        </Button>
        <p className="text-center text-xs leading-5 text-[#302D27]/60">
          Your review is published immediately. Please share an honest, respectful experience.
        </p>
        <p className="sr-only" role="status" aria-live="polite">
          {isSubmitting ? 'Submitting review' : ''}
        </p>
      </div>
      </div>
    </form>
  );
}
