'use client';

import * as React from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  ImageOff,
  Images,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AdminFilterSelect,
  AdminListToolbar,
  AdminPagination,
} from '@/components/admin/shared/admin-list-controls';
import {
  FinishAdditionalImagesUploader,
  FinishMainImageUploader,
} from '@/components/admin/finishes/finish-image-uploader';
import {
  createMetalFinishAdmin,
  deleteMetalFinishAdmin,
  getMetalFinishCountsAdmin,
  getMetalFinishesAdminPage,
  getMetalFinishSupportAdmin,
  reorderMetalFinishAdmin,
  updateMetalFinishAdmin,
  updateMetalFinishStatusAdmin,
  type MetalFinishAdminPage,
  type MetalFinishAdminQuery,
  type MetalFinishCounts,
  type MetalFinishSort,
  type MetalFinishStatusFilter,
} from '@/lib/supabase/metal-finishes-admin';
import { deleteCatalogImageIfUnreferenced } from '@/lib/supabase/admin-catalog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getAdminPageCount } from '@/lib/admin/list-utils';
import {
  DEFAULT_FINISH_APPLICATIONS,
  METAL_FINISH_STATUSES,
} from '@/lib/supabase/metal-finishes-shared';
import type { MetalFinish, MetalFinishStatus } from '@/lib/types';

interface MetalFinishFormState {
  finishCode: string;
  name: string;
  appearance: string;
  applications: string;
  shortDescription: string;
  mainImageUrl: string;
  additionalImages: string[];
  status: MetalFinishStatus;
  displayOrder: string;
}

function emptyForm(): MetalFinishFormState {
  return {
    finishCode: '',
    name: '',
    appearance: '',
    applications: DEFAULT_FINISH_APPLICATIONS,
    shortDescription: '',
    mainImageUrl: '',
    additionalImages: [],
    status: 'draft',
    displayOrder: '',
  };
}

const EMPTY_PAGE: MetalFinishAdminPage = {
  finishes: [],
  total: 0,
  page: 1,
  pageSize: 8,
  pageCount: 1,
};

const EMPTY_COUNTS: MetalFinishCounts = {
  total: 0,
  published: 0,
  draft: 0,
  missingImage: 0,
};

const PAGE_SIZE = 8;

const STATUS_OPTIONS = METAL_FINISH_STATUSES.map((status) => ({
  value: status,
  label: status[0].toUpperCase() + status.slice(1),
}));

function statusBadgeClass(status: MetalFinishStatus) {
  if (status === 'published') return 'bg-emerald-500/20 text-emerald-400';
  if (status === 'archived') return 'bg-zinc-500/20 text-zinc-400';
  return 'bg-amber-500/20 text-amber-400';
}

function finishInputFromForm(
  form: MetalFinishFormState,
  status: MetalFinishStatus
) {
  return {
    finish_code: form.finishCode.trim() || null,
    name: form.name,
    appearance: form.appearance,
    applications: form.applications,
    short_description: form.shortDescription,
    main_image_url: form.mainImageUrl,
    additional_images: form.additionalImages,
    status,
    display_order: Number.parseInt(form.displayOrder, 10) || 0,
  };
}

export function MetalFinishesManagement({
  onTotalChange,
}: {
  onTotalChange?: (count: number) => void;
}) {
  const [supported, setSupported] = React.useState<boolean | null>(null);
  const [supportError, setSupportError] = React.useState<string | null>(null);
  const [counts, setCounts] = React.useState<MetalFinishCounts>(EMPTY_COUNTS);
  const [reloadToken, setReloadToken] = React.useState(0);

  const [pageData, setPageData] = React.useState<MetalFinishAdminPage>(EMPTY_PAGE);
  const [listLoading, setListLoading] = React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);
  const requestIdRef = React.useRef(0);

  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = React.useState<MetalFinishStatusFilter>('all');
  const [sort, setSort] = React.useState<MetalFinishSort>('display_order');
  const [page, setPage] = React.useState(1);

  const [form, setForm] = React.useState<MetalFinishFormState>(emptyForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editorSession, setEditorSession] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [actionId, setActionId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const formRef = React.useRef<HTMLDivElement>(null);
  const sessionUploadsRef = React.useRef<Set<string>>(new Set());
  const editingImagesRef = React.useRef<string[]>([]);

  const trackUploadedImage = React.useCallback((url: string) => {
    if (url) sessionUploadsRef.current.add(url);
  }, []);

  const cleanupUrls = React.useCallback((urls: ReadonlyArray<string>) => {
    urls.forEach((url) => {
      void deleteCatalogImageIfUnreferenced(url);
    });
  }, []);

  const cleanupSessionUploads = React.useCallback(() => {
    const urls = Array.from(sessionUploadsRef.current);
    sessionUploadsRef.current.clear();
    cleanupUrls(urls);
  }, [cleanupUrls]);

  React.useEffect(
    () => () => {
      const urls = Array.from(sessionUploadsRef.current);
      sessionUploadsRef.current.clear();
      for (const url of urls) {
        void deleteCatalogImageIfUnreferenced(url);
      }
    },
    []
  );

  const setField = <K extends keyof MetalFinishFormState>(
    key: K,
    value: MetalFinishFormState[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetEditor = React.useCallback(() => {
    cleanupSessionUploads();
    editingImagesRef.current = [];
    setForm(emptyForm());
    setEditingId(null);
    // Remount the uploaders so in-flight uploads from the previous form cannot
    // append into the reset form.
    setEditorSession((value) => value + 1);
  }, [cleanupSessionUploads]);

  const refreshCounts = React.useCallback(async () => {
    const next = await getMetalFinishCountsAdmin();
    setCounts(next);
    onTotalChange?.(next.total);
  }, [onTotalChange]);

  React.useEffect(() => {
    let cancelled = false;
    setSupported(null);
    setSupportError(null);
    getMetalFinishSupportAdmin()
      .then((value) => {
        if (!cancelled) setSupported(value);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSupported(false);
          setSupportError(
            error instanceof Error
              ? error.message
              : 'The Metal Finishes schema check failed.'
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  React.useEffect(() => {
    if (supported !== true) return;
    refreshCounts().catch(() => {
      setCounts(EMPTY_COUNTS);
      onTotalChange?.(0);
    });
  }, [supported, refreshCounts, reloadToken, onTotalChange]);

  React.useEffect(() => {
    if (supported !== true) return;
    const requestId = ++requestIdRef.current;
    setListLoading(true);
    setListError(null);

    const query: MetalFinishAdminQuery = {
      search: debouncedSearch,
      status: statusFilter,
      sort,
      page,
      pageSize: PAGE_SIZE,
    };

    getMetalFinishesAdminPage(query)
      .then((result) => {
        if (requestIdRef.current !== requestId) return;
        setPageData(result);
        if (result.total > 0 && result.page > result.pageCount) {
          setPage(result.pageCount);
        }
      })
      .catch((error: unknown) => {
        if (requestIdRef.current !== requestId) return;
        setPageData(EMPTY_PAGE);
        setListError(
          error instanceof Error
            ? error.message
            : 'The finish list could not be loaded.'
        );
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setListLoading(false);
      });
  }, [supported, debouncedSearch, statusFilter, sort, page, reloadToken]);

  const hasFilters =
    Boolean(search.trim()) || statusFilter !== 'all' || sort !== 'display_order';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSort('display_order');
    setPage(1);
  };

  const startNewFinish = () => {
    resetEditor();
    setMessage(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startEdit = (finish: MetalFinish) => {
    cleanupSessionUploads();
    setMessage(null);
    setEditingId(finish.id);
    editingImagesRef.current = [
      finish.mainImageUrl,
      ...(finish.additionalImages ?? []),
    ].filter((url): url is string => Boolean(url));
    setForm({
      finishCode: finish.finishCode,
      name: finish.name,
      appearance: finish.appearance,
      applications: finish.applications,
      shortDescription: finish.shortDescription ?? '',
      mainImageUrl: finish.mainImageUrl,
      additionalImages: finish.additionalImages ?? [],
      status: finish.status,
      displayOrder: String(finish.displayOrder ?? 0),
    });
    setEditorSession((value) => value + 1);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const save = async (status: MetalFinishStatus) => {
    if (saving) return;

    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'A finish name is required.' });
      return;
    }

    if (status === 'published') {
      if (!form.mainImageUrl.trim()) {
        setMessage({
          type: 'error',
          text: 'Upload a main finish image before publishing.',
        });
        return;
      }
      if (!form.appearance.trim() || !form.applications.trim()) {
        setMessage({
          type: 'error',
          text: 'Appearance and applications are required before publishing.',
        });
        return;
      }
    }

    setSaving(true);
    setMessage(null);

    try {
      const input = finishInputFromForm(form, status);

      if (editingId) {
        await updateMetalFinishAdmin(editingId, input);
        const nextImages = new Set(
          [input.main_image_url, ...(input.additional_images ?? [])].filter(
            (url): url is string => Boolean(url)
          )
        );
        cleanupUrls(editingImagesRef.current.filter((url) => !nextImages.has(url)));
        editingImagesRef.current = [];
        setMessage({
          type: 'success',
          text:
            status === 'published'
              ? 'Finish published successfully.'
              : status === 'archived'
                ? 'Finish archived.'
                : 'Finish saved as draft.',
        });
      } else {
        await createMetalFinishAdmin(input);
        setMessage({
          type: 'success',
          text:
            status === 'published'
              ? 'Finish published successfully.'
              : status === 'archived'
                ? 'Finish saved as archived.'
                : 'Finish saved as draft.',
        });
      }

      resetEditor();
      setPage(1);
      setReloadToken((token) => token + 1);
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'The finish could not be saved.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void save(form.status);
  };

  const handleDelete = async (finish: MetalFinish) => {
    if (
      !confirm(
        `Delete "${finish.name}" (${finish.finishCode})? This cannot be undone.`
      )
    ) {
      return;
    }
    setActionId(finish.id);
    setMessage(null);
    try {
      await deleteMetalFinishAdmin(finish.id);
      cleanupUrls(
        [finish.mainImageUrl, ...(finish.additionalImages ?? [])].filter(
          (url): url is string => Boolean(url)
        )
      );
      if (editingId === finish.id) resetEditor();
      setMessage({ type: 'success', text: 'Finish deleted.' });
      setReloadToken((token) => token + 1);
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'The finish could not be deleted.',
      });
    } finally {
      setActionId(null);
    }
  };

  const handleTogglePublished = async (finish: MetalFinish) => {
    const nextStatus: MetalFinishStatus =
      finish.status === 'published' ? 'draft' : 'published';

    if (nextStatus === 'published') {
      if (!finish.mainImageUrl) {
        setMessage({
          type: 'error',
          text: 'Upload a main finish image before publishing.',
        });
        return;
      }
      if (!finish.appearance || !finish.applications) {
        setMessage({
          type: 'error',
          text: 'Appearance and applications are required before publishing.',
        });
        return;
      }
    }

    setActionId(finish.id);
    setMessage(null);
    try {
      await updateMetalFinishStatusAdmin(finish.id, nextStatus);
      setMessage({
        type: 'success',
        text:
          nextStatus === 'published'
            ? `${finish.name} is now published.`
            : `${finish.name} moved back to draft.`,
      });
      setReloadToken((token) => token + 1);
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'The publishing status could not be updated.',
      });
    } finally {
      setActionId(null);
    }
  };

  const handleMove = async (
    finish: MetalFinish,
    direction: 'up' | 'down'
  ) => {
    setActionId(finish.id);
    setMessage(null);
    try {
      await reorderMetalFinishAdmin(finish.id, direction);
      setReloadToken((token) => token + 1);
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'The display order could not be changed.',
      });
    } finally {
      setActionId(null);
    }
  };

  if (supported === null) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card/60 p-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking Metal Finishes database support…
      </div>
    );
  }

  if (supported === false) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-amber-300">
              Metal Finishes database migration not detected
            </h3>
            <p className="max-w-2xl text-xs leading-relaxed text-amber-200/80">
              The public section continues to show the original 12 finishes from
              the static content module. Apply the approved additive migration
              to manage them here. No existing data is affected.
            </p>
            {supportError && (
              <p className="text-[11px] text-amber-200/60">
                Details: {supportError}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReloadToken((token) => token + 1)}
              className="border-amber-500/40 bg-transparent text-amber-200 hover:bg-amber-500/15"
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              Check again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pageCount = getAdminPageCount(pageData.total, PAGE_SIZE);

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Images className="h-5 w-5 text-gold-deep" />
            Metal Finishes
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage the finish references shown in the public Metal Services
            carousel.
          </p>
        </div>
        <Button
          type="button"
          onClick={startNewFinish}
          className="rounded-xl gold-button font-medium"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add New Finish
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Total
          </p>
          <p className="mt-1 text-2xl font-semibold">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Published
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-400">
            {counts.published}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Drafts
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-400">
            {counts.draft}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Without Main Image
          </p>
          <p className="mt-1 text-2xl font-semibold text-muted-foreground">
            {counts.missingImage}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div
          ref={formRef}
          className="scroll-mt-24 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl xl:col-span-2"
        >
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Plus className="h-4 w-4 text-gold-deep" />
            {editingId ? 'Edit Finish' : 'Add New Finish'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold-deep">
                Basic information
              </h4>
              <div>
                <Label>Finish Name *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(event) => setField('name', event.currentTarget.value)}
                  placeholder="Satin Brass"
                />
              </div>
              <div>
                <Label>Finish Code</Label>
                <Input
                  value={form.finishCode}
                  onChange={(event) =>
                    setField('finishCode', event.currentTarget.value)
                  }
                  placeholder="Auto-generated FIN-XXXX if left blank"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Codes are unique and follow the FIN-XXXX reference pattern.
                </p>
              </div>
              <div>
                <Label>Appearance *</Label>
                <Input
                  value={form.appearance}
                  onChange={(event) =>
                    setField('appearance', event.currentTarget.value)
                  }
                  placeholder="Reflective appearance"
                />
              </div>
              <div>
                <Label>Applications *</Label>
                <Textarea
                  value={form.applications}
                  onChange={(event) =>
                    setField('applications', event.currentTarget.value)
                  }
                  placeholder="Where this finish is typically used."
                  className="min-h-[70px]"
                />
              </div>
              <div>
                <Label>Short Description</Label>
                <Textarea
                  value={form.shortDescription}
                  onChange={(event) =>
                    setField('shortDescription', event.currentTarget.value)
                  }
                  placeholder="Optional supporting note for this finish."
                  className="min-h-[70px]"
                />
              </div>
            </section>

            <section className="space-y-3 border-t border-border/60 pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold-deep">
                Images
              </h4>
              <FinishMainImageUploader
                key={`main-${editorSession}`}
                value={form.mainImageUrl}
                onChange={(url) => setField('mainImageUrl', url)}
                onUploaded={trackUploadedImage}
                disabled={saving}
              />
              <FinishAdditionalImagesUploader
                key={`additional-${editorSession}`}
                values={form.additionalImages}
                onAdd={(url) =>
                  setForm((current) => ({
                    ...current,
                    additionalImages: [...current.additionalImages, url],
                  }))
                }
                onRemove={(url) =>
                  setForm((current) => ({
                    ...current,
                    additionalImages: current.additionalImages.filter(
                      (image) => image !== url
                    ),
                  }))
                }
                onMove={(url, direction) =>
                  setForm((current) => {
                    const index = current.additionalImages.indexOf(url);
                    if (index < 0) return current;
                    const target = direction === 'up' ? index - 1 : index + 1;
                    if (target < 0 || target >= current.additionalImages.length) {
                      return current;
                    }
                    const next = [...current.additionalImages];
                    [next[index], next[target]] = [next[target], next[index]];
                    return { ...current, additionalImages: next };
                  })
                }
                onReplace={(previousUrl, nextUrl) =>
                  setForm((current) => ({
                    ...current,
                    additionalImages: current.additionalImages.map((image) =>
                      image === previousUrl ? nextUrl : image
                    ),
                  }))
                }
                onUploaded={trackUploadedImage}
                disabled={saving}
              />
            </section>

            <section className="space-y-3 border-t border-border/60 pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold-deep">
                Publishing
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setField(
                        'status',
                        event.currentTarget.value as MetalFinishStatus
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={(event) =>
                      setField('displayOrder', event.currentTarget.value)
                    }
                    placeholder="Auto (append)"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                New finishes are appended automatically when display order is
                left blank or zero. Published finishes need a main image,
                appearance and applications.
              </p>
            </section>

            <div className="space-y-2 border-t border-border/60 pt-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void save('draft')}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Draft'}
                </Button>
                <Button
                  type="button"
                  onClick={() => void save('published')}
                  disabled={saving}
                  className="w-full gold-button font-medium"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save & Publish'
                  )}
                </Button>
              </div>
              {editingId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetEditor}
                  disabled={saving}
                  className="w-full"
                >
                  Cancel Editing
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl xl:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Images className="h-4 w-4 text-gold-deep" />
              Finishes ({counts.total})
            </h3>
            {listLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <AdminListToolbar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Search finish name or code…"
            resultCount={pageData.total}
            totalCount={counts.total}
            onClear={clearFilters}
            clearDisabled={!hasFilters}
          >
            <AdminFilterSelect
              label="Status"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value as MetalFinishStatusFilter);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All statuses' },
                ...STATUS_OPTIONS,
              ]}
            />
            <AdminFilterSelect
              label="Sort"
              value={sort}
              onChange={(value) => {
                setSort(value as MetalFinishSort);
                setPage(1);
              }}
              options={[
                { value: 'display_order', label: 'Display order' },
                { value: 'name', label: 'Name A–Z' },
              ]}
            />
          </AdminListToolbar>

          {listError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{listError}</span>
            </div>
          )}

          {listLoading && pageData.finishes.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading finishes…
            </div>
          ) : pageData.finishes.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {hasFilters
                ? 'No finishes match these filters.'
                : 'No finishes yet. Add the first finish.'}
            </div>
          ) : (
            <div className="space-y-3">
              {pageData.finishes.map((finish) => (
                <div
                  key={finish.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    editingId === finish.id
                      ? 'border-gold/50 bg-gold/5'
                      : 'border-border/60 bg-background/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {finish.mainImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={finish.mainImageUrl}
                          alt={`${finish.name} finish`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-1 text-[9px] text-muted-foreground">
                          <ImageOff className="h-4 w-4" />
                          No image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="truncate text-sm font-semibold">
                          {finish.name}
                        </h4>
                        <span className="rounded-full bg-[#eae5dd] px-2 py-0.5 text-[10px] font-semibold text-[#62594c]">
                          {finish.finishCode}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusBadgeClass(
                            finish.status
                          )}`}
                        >
                          {finish.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {finish.appearance || 'No appearance set'}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                        {finish.applications || 'No applications set'}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Order {finish.displayOrder}
                        {finish.additionalImages.length > 0
                          ? ` • ${finish.additionalImages.length} additional image${
                              finish.additionalImages.length === 1 ? '' : 's'
                            }`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(finish)}
                      disabled={actionId === finish.id}
                    >
                      <Edit className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleTogglePublished(finish)}
                      disabled={actionId === finish.id}
                    >
                      {finish.status === 'published' ? (
                        <>
                          <EyeOff className="mr-1 h-3.5 w-3.5" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Publish
                        </>
                      )}
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <a
                        href={`/admin/preview/finish/${finish.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                        Preview
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleMove(finish, 'up')}
                      disabled={actionId === finish.id}
                      aria-label={`Move ${finish.name} earlier`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleMove(finish, 'down')}
                      disabled={actionId === finish.id}
                      aria-label={`Move ${finish.name} later`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDelete(finish)}
                      disabled={actionId === finish.id}
                      className="ml-auto text-destructive hover:bg-destructive/10"
                    >
                      {actionId === finish.id ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <AdminPagination
            page={pageData.page}
            pageCount={pageCount}
            total={pageData.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
