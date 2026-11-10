'use client';

import * as React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Images,
  Loader2,
  Plus,
  RefreshCw,
  Search,
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
  AdditionalImagesUploader,
  TransformationImageUploader,
} from '@/components/admin/before-after/transformation-image-uploader';
import {
  BEFORE_AFTER_COMPARISON_TYPES,
  BEFORE_AFTER_MATERIAL_OPTIONS,
  BEFORE_AFTER_STATUSES,
  slugifyBeforeAfterTitle,
} from '@/lib/supabase/before-after-shared';
import {
  createBeforeAfterProjectAdmin,
  deleteBeforeAfterProjectAdmin,
  getBeforeAfterCountAdmin,
  getBeforeAfterMaterialsAdmin,
  getBeforeAfterProjectsAdminPage,
  getBeforeAfterSupportAdmin,
  updateBeforeAfterProjectAdmin,
  updateBeforeAfterStatusAdmin,
  type BeforeAfterAdminPage,
  type BeforeAfterAdminQuery,
  type BeforeAfterFeaturedFilter,
  type BeforeAfterProjectInput,
  type BeforeAfterSort,
} from '@/lib/supabase/before-after-admin';
import { deleteCatalogImageIfUnreferenced } from '@/lib/supabase/admin-catalog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getAdminPageCount } from '@/lib/admin/list-utils';
import type {
  BeforeAfterComparisonType,
  BeforeAfterProject,
  BeforeAfterStatus,
} from '@/lib/types';

interface AdminLinkOption {
  id: string;
  name: string;
  slug?: string;
}

interface BeforeAfterFormState {
  title: string;
  slug: string;
  reference: string;
  shortDescription: string;
  description: string;
  componentType: string;
  material: string;
  finishName: string;
  finishDescription: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  additionalImages: string[];
  initialCondition: string;
  treatmentDescription: string;
  finalDescription: string;
  features: string;
  comparisonType: BeforeAfterComparisonType;
  verificationConfirmed: boolean;
  status: BeforeAfterStatus;
  isFeatured: boolean;
  displayOrder: string;
  projectDate: string;
  relatedCategoryId: string;
  relatedProductId: string;
  serviceIds: string[];
}

const EMPTY_FORM: BeforeAfterFormState = {
  title: '',
  slug: '',
  reference: '',
  shortDescription: '',
  description: '',
  componentType: '',
  material: '',
  finishName: '',
  finishDescription: '',
  beforeImageUrl: '',
  afterImageUrl: '',
  additionalImages: [],
  initialCondition: '',
  treatmentDescription: '',
  finalDescription: '',
  features: '',
  comparisonType: 'illustrative',
  verificationConfirmed: false,
  status: 'draft',
  isFeatured: false,
  displayOrder: '0',
  projectDate: '',
  relatedCategoryId: '',
  relatedProductId: '',
  serviceIds: [],
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const COMPARISON_OPTIONS = [
  { value: 'verified', label: 'Verified project' },
  { value: 'illustrative', label: 'Illustrative comparison' },
];

const EMPTY_PAGE: BeforeAfterAdminPage = {
  projects: [],
  total: 0,
  page: 1,
  pageSize: 8,
  pageCount: 1,
};

const PAGE_SIZE = 8;

function statusBadgeClass(status: BeforeAfterStatus) {
  if (status === 'published') return 'bg-emerald-500/20 text-emerald-400';
  if (status === 'archived') return 'bg-zinc-500/20 text-zinc-400';
  return 'bg-amber-500/20 text-amber-400';
}

function projectInputFromForm(
  form: BeforeAfterFormState,
  status: BeforeAfterStatus
): BeforeAfterProjectInput {
  return {
    title: form.title,
    slug: form.slug,
    reference: form.reference,
    short_description: form.shortDescription,
    description: form.description,
    component_type: form.componentType,
    material: form.material,
    finish_name: form.finishName,
    finish_description: form.finishDescription,
    before_image_url: form.beforeImageUrl,
    after_image_url: form.afterImageUrl,
    additional_images: form.additionalImages,
    initial_condition: form.initialCondition,
    treatment_description: form.treatmentDescription,
    final_description: form.finalDescription,
    features: form.features.split(/\r?\n/),
    comparison_type: form.comparisonType,
    verification_confirmed: form.verificationConfirmed,
    status,
    is_featured: form.isFeatured,
    display_order: Number.parseInt(form.displayOrder, 10) || 0,
    project_date: form.projectDate || null,
    related_category_id: form.relatedCategoryId || null,
    related_product_id: form.relatedProductId || null,
    service_ids: form.serviceIds,
  };
}

export function BeforeAfterManagement({
  categories,
  products,
  services,
  onTotalChange,
}: {
  categories: AdminLinkOption[];
  products: AdminLinkOption[];
  services: AdminLinkOption[];
  onTotalChange: (count: number) => void;
}) {
  const [supported, setSupported] = React.useState<boolean | null>(null);
  const [supportError, setSupportError] = React.useState<string | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);
  const [materials, setMaterials] = React.useState<string[]>([]);
  const [reloadToken, setReloadToken] = React.useState(0);

  const [pageData, setPageData] = React.useState<BeforeAfterAdminPage>(EMPTY_PAGE);
  const [listLoading, setListLoading] = React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);
  const requestIdRef = React.useRef(0);

  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [serviceFilter, setServiceFilter] = React.useState('');
  const [materialFilter, setMaterialFilter] = React.useState('');
  const [comparisonFilter, setComparisonFilter] = React.useState<'all' | BeforeAfterComparisonType>('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | BeforeAfterStatus>('all');
  const [featuredFilter, setFeaturedFilter] = React.useState<BeforeAfterFeaturedFilter>('all');
  const [sort, setSort] = React.useState<BeforeAfterSort>('display_order');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [page, setPage] = React.useState(1);

  const [form, setForm] = React.useState<BeforeAfterFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [serviceSearch, setServiceSearch] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [actionId, setActionId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
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

  const setField = <K extends keyof BeforeAfterFormState>(
    key: K,
    value: BeforeAfterFormState[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetEditor = React.useCallback(() => {
    cleanupSessionUploads();
    editingImagesRef.current = [];
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSlugTouched(false);
    setServiceSearch('');
  }, [cleanupSessionUploads]);

  const refreshCount = React.useCallback(async () => {
    try {
      const count = await getBeforeAfterCountAdmin();
      setTotalCount(count);
      onTotalChange(count);
    } catch {
      setTotalCount(0);
      onTotalChange(0);
    }
  }, [onTotalChange]);

  React.useEffect(() => {
    let cancelled = false;
    setSupported(null);
    setSupportError(null);
    getBeforeAfterSupportAdmin()
      .then((value) => {
        if (!cancelled) setSupported(value);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSupported(false);
          setSupportError(
            error instanceof Error ? error.message : 'The Before & After schema check failed.'
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  React.useEffect(() => {
    if (supported !== true) return;
    void refreshCount();
    getBeforeAfterMaterialsAdmin()
      .then((rows) => setMaterials(rows))
      .catch(() => setMaterials([]));
  }, [supported, refreshCount, reloadToken]);

  React.useEffect(() => {
    if (supported !== true) return;
    const requestId = ++requestIdRef.current;
    setListLoading(true);
    setListError(null);

    const query: BeforeAfterAdminQuery = {
      search: debouncedSearch,
      serviceId: serviceFilter || undefined,
      material: materialFilter || undefined,
      comparisonType: comparisonFilter,
      status: statusFilter,
      featured: featuredFilter,
      sort,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      pageSize: PAGE_SIZE,
    };

    getBeforeAfterProjectsAdminPage(query)
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
          error instanceof Error ? error.message : 'The project list could not be loaded.'
        );
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setListLoading(false);
      });
  }, [
    supported,
    debouncedSearch,
    serviceFilter,
    materialFilter,
    comparisonFilter,
    statusFilter,
    featuredFilter,
    sort,
    dateFrom,
    dateTo,
    page,
    reloadToken,
  ]);

  const hasFilters =
    Boolean(search.trim()) ||
    Boolean(serviceFilter) ||
    Boolean(materialFilter) ||
    comparisonFilter !== 'all' ||
    statusFilter !== 'all' ||
    featuredFilter !== 'all' ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const clearFilters = () => {
    setSearch('');
    setServiceFilter('');
    setMaterialFilter('');
    setComparisonFilter('all');
    setStatusFilter('all');
    setFeaturedFilter('all');
    setDateFrom('');
    setDateTo('');
    setSort('display_order');
    setPage(1);
  };

  const materialOptions = React.useMemo(
    () =>
      Array.from(new Set([...materials, ...BEFORE_AFTER_MATERIAL_OPTIONS])).sort((a, b) =>
        a.localeCompare(b)
      ),
    [materials]
  );

  const filteredServices = React.useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();
    if (!query) return services;
    return services.filter((service) =>
      `${service.name} ${service.slug ?? ''}`.toLowerCase().includes(query)
    );
  }, [serviceSearch, services]);

  const startEdit = (project: BeforeAfterProject) => {
    cleanupSessionUploads();
    setMessage(null);
    setEditingId(project.id);
    setSlugTouched(true);
    setServiceSearch('');
    editingImagesRef.current = [
      project.beforeImageUrl,
      project.afterImageUrl,
      ...(project.additionalImages ?? []),
    ].filter((url): url is string => Boolean(url));
    setForm({
      title: project.title,
      slug: project.slug,
      reference: project.reference ?? '',
      shortDescription: project.shortDescription ?? '',
      description: project.description ?? '',
      componentType: project.componentType ?? '',
      material: project.material ?? '',
      finishName: project.finishName ?? '',
      finishDescription: project.finishDescription ?? '',
      beforeImageUrl: project.beforeImageUrl ?? '',
      afterImageUrl: project.afterImageUrl ?? '',
      additionalImages: project.additionalImages ?? [],
      initialCondition: project.initialCondition ?? '',
      treatmentDescription: project.treatmentDescription ?? '',
      finalDescription: project.finalDescription ?? '',
      features: (project.features ?? []).join('\n'),
      comparisonType: project.comparisonType,
      verificationConfirmed: project.verificationConfirmed,
      status: project.status,
      isFeatured: project.isFeatured,
      displayOrder: String(project.displayOrder ?? 0),
      projectDate: project.projectDate ?? '',
      relatedCategoryId: project.relatedCategoryId ?? '',
      relatedProductId: project.relatedProductId ?? '',
      serviceIds: project.services.map((service) => service.id),
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!form.title.trim() || !form.slug.trim()) {
      setMessage({ type: 'error', text: 'A title and URL slug are required.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const input = projectInputFromForm(form, form.status);
      if (editingId) {
        await updateBeforeAfterProjectAdmin(editingId, input);
        const nextImages = new Set(
          [input.before_image_url, input.after_image_url, ...(input.additional_images ?? [])].filter(
            (url): url is string => Boolean(url)
          )
        );
        cleanupUrls(editingImagesRef.current.filter((url) => !nextImages.has(url)));
        editingImagesRef.current = [];
        setMessage({
          type: 'success',
          text:
            form.status === 'published'
              ? 'Published transformation updated successfully.'
              : 'Transformation updated successfully.',
        });
      } else {
        await createBeforeAfterProjectAdmin(input);
        setMessage({
          type: 'success',
          text:
            form.status === 'published'
              ? 'Transformation published successfully.'
              : 'Transformation saved successfully.',
        });
      }
      resetEditor();
      setPage(1);
      setReloadToken((token) => token + 1);
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'The project could not be saved.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project: BeforeAfterProject) => {
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    setActionId(project.id);
    setMessage(null);
    try {
      await deleteBeforeAfterProjectAdmin(project.id);
      cleanupUrls(
        [
          project.beforeImageUrl,
          project.afterImageUrl,
          ...(project.additionalImages ?? []),
        ].filter((url): url is string => Boolean(url))
      );
      if (editingId === project.id) resetEditor();
      setMessage({ type: 'success', text: 'Transformation deleted.' });
      setReloadToken((token) => token + 1);
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'The project could not be deleted.',
      });
    } finally {
      setActionId(null);
    }
  };

  const handleTogglePublished = async (project: BeforeAfterProject) => {
    const nextStatus: BeforeAfterStatus =
      project.status === 'published' ? 'draft' : 'published';

    if (nextStatus === 'published') {
      if (!project.beforeImageUrl || !project.afterImageUrl) {
        setMessage({
          type: 'error',
          text: 'Upload both the before and after images before publishing.',
        });
        return;
      }
      if (project.comparisonType === 'verified' && !project.verificationConfirmed) {
        setMessage({
          type: 'error',
          text: 'Confirm that both images document the same object before publishing a verified comparison.',
        });
        return;
      }
    }

    setActionId(project.id);
    setMessage(null);
    try {
      await updateBeforeAfterStatusAdmin(project.id, nextStatus);
      setMessage({
        type: 'success',
        text:
          nextStatus === 'published'
            ? 'Transformation published.'
            : 'Transformation moved back to draft.',
      });
      setReloadToken((token) => token + 1);
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'The publishing status could not be updated.',
      });
    } finally {
      setActionId(null);
    }
  };

  if (supported === null) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card/60 p-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking Before &amp; After database support…
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
              Before &amp; After database migration not detected
            </h3>
            <p className="max-w-2xl text-xs leading-relaxed text-amber-200/80">
              The public gallery and this admin tab stay safely hidden until the approved
              additive migration is applied. Existing catalogue, inquiry and settings data
              are unaffected.
            </p>
            {supportError && (
              <p className="text-[11px] text-amber-200/60">Details: {supportError}</p>
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl xl:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Plus className="h-4 w-4 text-gold-deep" />
            {editingId ? 'Edit Transformation' : 'Add Transformation'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold-deep">
                Project details
              </h4>
              <div>
                <Label>Title *</Label>
                <Input
                  required
                  value={form.title}
                  onChange={(event) => {
                    const title = event.currentTarget.value;
                    setForm((current) => ({
                      ...current,
                      title,
                      slug: slugTouched ? current.slug : slugifyBeforeAfterTitle(title),
                    }));
                  }}
                  placeholder="Restored Brass Door Handle"
                />
              </div>
              <div>
                <Label>URL Slug *</Label>
                <Input
                  required
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setField('slug', event.currentTarget.value);
                  }}
                  placeholder="restored-brass-door-handle"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Reference</Label>
                  <Input
                    value={form.reference}
                    onChange={(event) => setField('reference', event.currentTarget.value)}
                    placeholder="RTM-2026-014"
                  />
                </div>
                <div>
                  <Label>Project Date</Label>
                  <Input
                    type="date"
                    value={form.projectDate}
                    onChange={(event) => setField('projectDate', event.currentTarget.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Short Description</Label>
                <Textarea
                  value={form.shortDescription}
                  onChange={(event) => setField('shortDescription', event.currentTarget.value)}
                  placeholder="One-line summary shown on the gallery card."
                  className="min-h-[70px]"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(event) => setField('description', event.currentTarget.value)}
                  placeholder="Full project overview."
                  className="min-h-[100px]"
                />
              </div>
            </section>

            <section className="space-y-3 border-t border-border/60 pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold-deep">
                Before &amp; after images
              </h4>
              <TransformationImageUploader
                key={`before-${editingId ?? 'new'}`}
                label="Before Image"
                description="The original, worn or unfinished surface."
                value={form.beforeImageUrl}
                onChange={(url) => setField('beforeImageUrl', url)}
                onUploaded={trackUploadedImage}
                disabled={saving}
              />
              <TransformationImageUploader
                key={`after-${editingId ?? 'new'}`}
                label="After Image"
                description="The completed finish of the same object or surface."
                value={form.afterImageUrl}
                onChange={(url) => setField('afterImageUrl', url)}
                onUploaded={trackUploadedImage}
                disabled={saving}
              />
              <AdditionalImagesUploader
                key={`additional-${editingId ?? 'new'}`}
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
                    additionalImages: current.additionalImages.filter((image) => image !== url),
                  }))
                }
                onUploaded={trackUploadedImage}
                disabled={saving}
              />
            </section>

            <section className="space-y-3 border-t border-border/60 pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold-deep">
                Surface story
              </h4>
              <div>
                <Label>Initial Condition</Label>
                <Textarea
                  value={form.initialCondition}
                  onChange={(event) => setField('initialCondition', event.currentTarget.value)}
                  placeholder="Rust, scratches, peeling coating…"
                  className="min-h-[70px]"
                />
              </div>
              <div>
                <Label>Treatment</Label>
                <Textarea
                  value={form.treatmentDescription}
                  onChange={(event) => setField('treatmentDescription', event.currentTarget.value)}
                  placeholder="Cleaning, blasting, priming and coating steps."
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label>Final Result</Label>
                <Textarea
                  value={form.finalDescription}
                  onChange={(event) => setField('finalDescription', event.currentTarget.value)}
                  placeholder="The delivered finish and its performance."
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label>Features</Label>
                <Textarea
                  value={form.features}
                  onChange={(event) => setField('features', event.currentTarget.value)}
                  placeholder={'One feature per line\nUV-stable top coat\nSalt-spray tested'}
                  className="min-h-[80px]"
                />
              </div>
            </section>

            <section className="space-y-3 border-t border-border/60 pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold-deep">
                Component &amp; finish
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Component Type</Label>
                  <Input
                    value={form.componentType}
                    onChange={(event) => setField('componentType', event.currentTarget.value)}
                    placeholder="Door handle / railing / panel"
                  />
                </div>
                <div>
                  <Label>Material</Label>
                  <select
                    value={form.material}
                    onChange={(event) => setField('material', event.currentTarget.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select material</option>
                    {form.material &&
                      !materialOptions.includes(form.material) && (
                        <option value={form.material}>{form.material} (current)</option>
                      )}
                    {materialOptions.map((material) => (
                      <option key={material} value={material}>
                        {material}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Finish Name</Label>
                  <Input
                    value={form.finishName}
                    onChange={(event) => setField('finishName', event.currentTarget.value)}
                    placeholder="Antique Brass PU"
                  />
                </div>
                <div>
                  <Label>Related Category</Label>
                  <select
                    value={form.relatedCategoryId}
                    onChange={(event) => setField('relatedCategoryId', event.currentTarget.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">None</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label>Finish Description</Label>
                <Textarea
                  value={form.finishDescription}
                  onChange={(event) => setField('finishDescription', event.currentTarget.value)}
                  placeholder="Tone, sheen and coating system."
                  className="min-h-[70px]"
                />
              </div>
              <div>
                <Label>Related Product</Label>
                <select
                  value={form.relatedProductId}
                  onChange={(event) => setField('relatedProductId', event.currentTarget.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="space-y-3 border-t border-border/60 pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold-deep">
                Related services
              </h4>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={serviceSearch}
                  onChange={(event) => setServiceSearch(event.currentTarget.value)}
                  placeholder="Search services…"
                  className="pl-9"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {form.serviceIds.length} service{form.serviceIds.length === 1 ? '' : 's'} selected
              </p>
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border/70 bg-background/40 p-2">
                {filteredServices.length === 0 ? (
                  <p className="p-2 text-xs text-muted-foreground">No matching services.</p>
                ) : (
                  filteredServices.map((service) => {
                    const checked = form.serviceIds.includes(service.id);
                    return (
                      <label
                        key={service.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted/60"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm((current) => ({
                              ...current,
                              serviceIds: checked
                                ? current.serviceIds.filter((id) => id !== service.id)
                                : [...current.serviceIds, service.id],
                            }))
                          }
                        />
                        <span>{service.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </section>

            <section className="space-y-3 border-t border-border/60 pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold-deep">
                Comparison &amp; publishing
              </h4>
              <div>
                <Label>Comparison Type</Label>
                <select
                  value={form.comparisonType}
                  onChange={(event) => {
                    const value = event.currentTarget.value as BeforeAfterComparisonType;
                    setForm((current) => ({
                      ...current,
                      comparisonType: value,
                      verificationConfirmed: value === 'verified' ? current.verificationConfirmed : false,
                    }));
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {COMPARISON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <label
                className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
                  form.comparisonType === 'verified'
                    ? 'border-gold/30 bg-gold/5'
                    : 'border-border/60 bg-muted/20 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.verificationConfirmed}
                  disabled={form.comparisonType !== 'verified'}
                  onChange={(event) => setField('verificationConfirmed', event.currentTarget.checked)}
                  className="mt-0.5"
                />
                <span>
                  I confirm both photographs document the same object, and this is a genuine
                  RT Metals project.
                </span>
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <select
                    value={form.status}
                    onChange={(event) => setField('status', event.currentTarget.value as BeforeAfterStatus)}
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
                    value={form.displayOrder}
                    onChange={(event) => setField('displayOrder', event.currentTarget.value)}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) => setField('isFeatured', event.currentTarget.checked)}
                />
                Feature this project on the gallery
              </label>
              <p className="text-[11px] text-muted-foreground">
                Published records require both images. Verified records also require the
                confirmation above.
              </p>
            </section>

            <div className="space-y-2 border-t border-border/60 pt-4">
              <Button type="submit" disabled={saving} className="w-full gold-button font-medium">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : form.status === 'draft' ? (
                  'Save Draft'
                ) : form.status === 'archived' ? (
                  'Save as Archived'
                ) : editingId ? (
                  'Update Published Project'
                ) : (
                  'Save & Publish'
                )}
              </Button>
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
              Transformations ({totalCount})
            </h3>
            {listLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <AdminListToolbar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Search title, reference, material, finish…"
            resultCount={pageData.total}
            totalCount={totalCount}
            onClear={clearFilters}
            clearDisabled={!hasFilters}
          >
            <AdminFilterSelect
              label="Service"
              value={serviceFilter}
              onChange={(value) => {
                setServiceFilter(value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All services' },
                ...services.map((service) => ({ value: service.id, label: service.name })),
              ]}
            />
            <AdminFilterSelect
              label="Material"
              value={materialFilter}
              onChange={(value) => {
                setMaterialFilter(value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All materials' },
                ...materialOptions.map((material) => ({ value: material, label: material })),
              ]}
            />
            <AdminFilterSelect
              label="Type"
              value={comparisonFilter}
              onChange={(value) => {
                setComparisonFilter(value as 'all' | BeforeAfterComparisonType);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All comparisons' },
                { value: 'verified', label: 'Verified' },
                { value: 'illustrative', label: 'Illustrative' },
              ]}
            />
            <AdminFilterSelect
              label="Status"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value as 'all' | BeforeAfterStatus);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All statuses' },
                ...BEFORE_AFTER_STATUSES.map((status) => ({
                  value: status,
                  label: status[0].toUpperCase() + status.slice(1),
                })),
              ]}
            />
            <AdminFilterSelect
              label="Featured"
              value={featuredFilter}
              onChange={(value) => {
                setFeaturedFilter(value as BeforeAfterFeaturedFilter);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All' },
                { value: 'featured', label: 'Featured' },
                { value: 'not_featured', label: 'Not featured' },
              ]}
            />
            <AdminFilterSelect
              label="Sort"
              value={sort}
              onChange={(value) => {
                setSort(value as BeforeAfterSort);
                setPage(1);
              }}
              options={[
                { value: 'display_order', label: 'Display order' },
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
                { value: 'title', label: 'Title A–Z' },
              ]}
            />
            <label className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span>From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.currentTarget.value);
                  setPage(1);
                }}
                aria-label="Project date from"
                className="h-9 rounded-xl border border-border bg-background/60 px-2 text-xs text-foreground"
              />
            </label>
            <label className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span>To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.currentTarget.value);
                  setPage(1);
                }}
                aria-label="Project date to"
                className="h-9 rounded-xl border border-border bg-background/60 px-2 text-xs text-foreground"
              />
            </label>
          </AdminListToolbar>

          {listError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{listError}</span>
            </div>
          )}

          {listLoading && pageData.projects.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading transformations…
            </div>
          ) : pageData.projects.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {hasFilters
                ? 'No transformations match these filters.'
                : 'No transformations yet. Create the first project.'}
            </div>
          ) : (
            <div className="space-y-3">
              {pageData.projects.map((project) => (
                <div
                  key={project.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    editingId === project.id
                      ? 'border-gold/50 bg-gold/5'
                      : 'border-border/60 bg-background/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex shrink-0 gap-1">
                      <div className="h-16 w-14 overflow-hidden rounded-lg border border-border bg-muted">
                        {project.beforeImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={project.beforeImageUrl}
                            alt={`${project.title} before`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">
                            No before
                          </div>
                        )}
                      </div>
                      <div className="h-16 w-14 overflow-hidden rounded-lg border border-border bg-muted">
                        {project.afterImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={project.afterImageUrl}
                            alt={`${project.title} after`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">
                            No after
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="truncate text-sm font-semibold">{project.title}</h4>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusBadgeClass(
                            project.status
                          )}`}
                        >
                          {project.status}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            project.comparisonType === 'verified'
                              ? 'bg-gold/15 text-gold-deep'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {project.comparisonType === 'verified' ? 'Verified' : 'Illustrative'}
                        </span>
                        {project.isFeatured && (
                          <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {[project.reference, project.material, project.componentType]
                          .filter(Boolean)
                          .join(' • ') || 'No reference or material'}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {project.services.length > 0
                          ? project.services.map((service) => service.name).join(', ')
                          : 'No linked services'}
                        {project.projectDate ? ` • ${project.projectDate}` : ''}
                        {` • Order ${project.displayOrder}`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(project)}
                      disabled={actionId === project.id}
                    >
                      <Edit className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleTogglePublished(project)}
                      disabled={actionId === project.id}
                    >
                      {project.status === 'published' ? (
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
                    {project.status === 'published' ? (
                      <Button asChild variant="ghost" size="sm">
                        <a
                          href={`/before-after/${project.slug}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          Preview
                        </a>
                      </Button>
                    ) : (
                      <Button type="button" variant="ghost" size="sm" disabled>
                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                        Preview
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDelete(project)}
                      disabled={actionId === project.id}
                      className="ml-auto text-destructive hover:bg-destructive/10"
                    >
                      {actionId === project.id ? (
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
