'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FolderTree,
  Package,
  Wrench,
  MessageSquare,
  HelpCircle,
  Settings,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Images,
  Star,
  Layers,
  FileText,
  DollarSign,
  Tag,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  uploadCatalogImage,
  getCategoriesAdmin,
  getCategoriesAdminPage,
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,
  getProductsAdmin,
  getProductsAdminPage,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  getServicesAdmin,
  createServiceAdmin,
  updateServiceAdmin,
  deleteServiceAdmin,
  getTestimonialsAdmin,
  createTestimonialAdmin,
  updateTestimonialAdmin,
  deleteTestimonialAdmin,
  getFaqsAdmin,
  createFaqAdmin,
  updateFaqAdmin,
  deleteFaqAdmin,
  getSiteSettingsAdmin,
  updateSiteSettingAdmin,
  deleteSiteSettingAdmin,
} from '@/lib/supabase/admin-catalog';
import {
  getInquiriesAdmin,
  updateInquiryStatusAdmin,
  deleteInquiryAdmin,
} from '@/lib/supabase/inquiries';
import { getBeforeAfterCountAdmin } from '@/lib/supabase/before-after-admin';
import { getMetalFinishCountAdmin } from '@/lib/supabase/metal-finishes-admin';
import { BeforeAfterManagement } from '@/components/admin/before-after/before-after-management';
import { MetalFinishesManagement } from '@/components/admin/finishes/metal-finishes-management';
import {
  AdminFilterSelect,
  AdminListToolbar,
  AdminPagination,
} from '@/components/admin/shared/admin-list-controls';
import { AdminFormPanel } from '@/components/admin/shared/admin-form-panel';
import {
  getAdminPageCount,
  getAdminPageSlice,
  matchesAdminSearch,
} from '@/lib/admin/list-utils';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { InquiryStatus, MainSection, ProductImage } from '@/lib/types';
import { getCategoryHierarchySupportAdmin } from '@/lib/supabase/admin-catalog';
import { mapCategoryRow, mapProductImageRow, type DatabaseProductImageRow } from '@/lib/supabase/data-mapper';
import {
  getProductGalleryImages,
  mergeGallerySyncResult,
  sortGalleryImages,
  syncProductGalleryImages,
} from '@/lib/supabase/product-gallery';
import { getCategoryPath, getDescendantSlugs, getValidCategories, SECTION_LABELS } from '@/lib/category-hierarchy';
import {
  formatCategorySelectionCount,
  formatServiceSelectionCount,
  getMetalCategoryPickerOptions,
  isNoServiceAssigned,
  normalizeIdList,
  toggleIdSelection,
  toggleNoServiceAssigned,
} from '@/lib/service-categories';
import {
  getServiceCategoryErrorMessage,
  getServiceCategoryLinksAdmin,
  getServiceCategorySupportAdmin,
  isServiceCategoryConflict,
  replaceCategoryServicesAdmin,
  replaceServiceCategoriesAdmin,
  type ServiceCategoryLinkRow,
} from '@/lib/supabase/service-categories';
import { Inbox } from 'lucide-react';
import {
  ImagePreparationError,
  getImageErrorMessage,
  prepareImageUpload,
} from '@/lib/images/prepare-image-upload';
import { runWithConcurrency } from '@/lib/images/concurrency';
import { copySelectedFilesAndReset } from '@/lib/images/file-selection';
import {
  UPLOAD_CONCURRENCY,
  formatBytes,
  type ImagePurpose,
} from '@/lib/images/image-config';
import {
  ImageUploadStatusCard,
  ImageUploadStatusList,
  isImageUploadActive,
  type ImageUploadItem,
  type ImageUploadTarget,
} from '@/components/admin/image-upload-status';

const ADMIN_LIST_PAGE_SIZE = 8;

export function AdminWorkspace() {
  const [activeTab, setActiveTab] = React.useState<
    | 'categories'
    | 'products'
    | 'services'
    | 'testimonials'
    | 'metal-finishes'
    | 'before-after'
    | 'faqs'
    | 'settings'
    | 'inquiries'
  >('categories');

  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Image optimization / upload feedback state
  const [singleUpload, setSingleUpload] = React.useState<ImageUploadItem | null>(null);
  const [galleryUploads, setGalleryUploads] = React.useState<ImageUploadItem[]>([]);
  const gallerySourceRef = React.useRef<Map<string, File>>(new Map());
  const singleSourceRef = React.useRef<{
    file: File;
    setter: (url: string) => void;
    purpose: ImagePurpose;
    target: ImageUploadTarget;
  } | null>(null);
  const uploadControllersRef = React.useRef<Map<string, AbortController>>(new Map());
  const previewObjectUrlsRef = React.useRef<Set<string>>(new Set());
  const mountedRef = React.useRef(true);
  const galleryBaselineRef = React.useRef<ProductImage[]>([]);
  const galleryLoadedProductIdRef = React.useRef<string | null>(null);
  const removedGalleryIdsRef = React.useRef<Set<string>>(new Set());

  // Edit Mode state
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // ==================================================
  // CATEGORIES STATE
  // ==================================================
  const [categories, setCategories] = React.useState<any[]>([]);
  const [catName, setCatName] = React.useState('');
  const [catSlug, setCatSlug] = React.useState('');
  const [catTagline, setCatTagline] = React.useState('');
  const [catDesc, setCatDesc] = React.useState('');
  const [catImage, setCatImage] = React.useState('');
  const [catIsFeatured, setCatIsFeatured] = React.useState(false);
  const [catOrder, setCatOrder] = React.useState('0');
  const [hierarchySupported, setHierarchySupported] = React.useState<boolean | null>(null);
  const [catSection, setCatSection] = React.useState<MainSection | ''>('');
  const [catParentId, setCatParentId] = React.useState('');
  const [catIsPublished, setCatIsPublished] = React.useState(false);

  // ==================================================
  // PRODUCTS STATE (19 Complete Fields)
  // ==================================================
  const [products, setProducts] = React.useState<any[]>([]);
  const [prodName, setProdName] = React.useState('');
  const [prodSlug, setProdSlug] = React.useState('');
  const [prodSku, setProdSku] = React.useState('');
  const [prodCatId, setProdCatId] = React.useState('');
  const [prodSection, setProdSection] = React.useState<MainSection | ''>('');
  const [prodSubCat, setProdSubCat] = React.useState('');

  const [prodImage, setProdImage] = React.useState('');
  const [prodBadge, setProdBadge] = React.useState('');
  const [prodShortDesc, setProdShortDesc] = React.useState('');
  const [prodFullDesc, setProdFullDesc] = React.useState('');
  const [prodMaterial, setProdMaterial] = React.useState('');
  const [prodColorFinish, setProdColorFinish] = React.useState('');
  const [prodDimensions, setProdDimensions] = React.useState('');
  const [prodWeight, setProdWeight] = React.useState('');
  const [prodStockStatus, setProdStockStatus] = React.useState('in_stock');
  const [prodFeatures, setProdFeatures] = React.useState('');
  const [prodCareInstructions, setProdCareInstructions] = React.useState('');
  const [prodIsPublished, setProdIsPublished] = React.useState(false);
  const [prodIsFeatured, setProdIsFeatured] = React.useState(false);
  const [prodOrder, setProdOrder] = React.useState('0');
  const [prodGalleryImages, setProdGalleryImages] = React.useState<ProductImage[]>([]);

  // ==================================================
  // SERVICES STATE
  // ==================================================
  const [services, setServices] = React.useState<any[]>([]);
  const [svcName, setSvcName] = React.useState('');
  const [svcSlug, setSvcSlug] = React.useState('');
  const [svcShortName, setSvcShortName] = React.useState('');
  const [svcDesc, setSvcDesc] = React.useState('');
  const [svcLongDesc, setSvcLongDesc] = React.useState('');
  const [svcImage, setSvcImage] = React.useState('');
  const [svcFeatures, setSvcFeatures] = React.useState('');
  const [svcApplications, setSvcApplications] = React.useState('');
  const [svcProcessSteps, setSvcProcessSteps] = React.useState('');
  const [svcOrder, setSvcOrder] = React.useState('0');
  const [svcIsPublished, setSvcIsPublished] = React.useState(false);

  // ==================================================
  // SERVICE <-> METAL CATEGORY RELATIONSHIP STATE
  // ==================================================
  const [serviceCategorySupported, setServiceCategorySupported] = React.useState<boolean | null>(null);
  const [serviceCategoryLinks, setServiceCategoryLinks] = React.useState<ServiceCategoryLinkRow[]>([]);
  const [serviceCategoryLinksLoaded, setServiceCategoryLinksLoaded] = React.useState(false);
  const [serviceCategoryLinksError, setServiceCategoryLinksError] = React.useState<string | null>(null);

  // Service form: related Metal categories
  const [svcCategoryIds, setSvcCategoryIds] = React.useState<string[]>([]);
  const [svcCategoryBaseline, setSvcCategoryBaseline] = React.useState<string[] | null>([]);
  const [svcCategorySearch, setSvcCategorySearch] = React.useState('');

  // Category form: applicable Metal services
  const [catServiceIds, setCatServiceIds] = React.useState<string[]>([]);
  const [catServiceBaseline, setCatServiceBaseline] = React.useState<string[] | null>([]);

  // ==================================================
  // TESTIMONIALS STATE
  // ==================================================
  const [testimonials, setTestimonials] = React.useState<any[]>([]);
  const [testName, setTestName] = React.useState('');
  const [testCompany, setTestCompany] = React.useState('');
  const [testRole, setTestRole] = React.useState('');
  const [testContent, setTestContent] = React.useState('');
  const [testRating, setTestRating] = React.useState('5');
  const [testAvatar, setTestAvatar] = React.useState('');
  const [testOrder, setTestOrder] = React.useState('0');
  const [testIsPublished, setTestIsPublished] = React.useState(true);

  // ==================================================
  // BEFORE & AFTER STATE
  // ==================================================
  const [beforeAfterCount, setBeforeAfterCount] = React.useState(0);
  const handleBeforeAfterCountChange = React.useCallback(
    (count: number) => setBeforeAfterCount(count),
    []
  );

  // ==================================================
  // METAL FINISHES STATE
  // ==================================================
  const [metalFinishCount, setMetalFinishCount] = React.useState(0);
  const handleMetalFinishCountChange = React.useCallback(
    (count: number) => setMetalFinishCount(count),
    []
  );

  // ==================================================
  // ADMIN LIST SEARCH / FILTER / SORT / PAGINATION
  // ==================================================
  const [catListSearch, setCatListSearch] = React.useState('');
  const [catListSection, setCatListSection] = React.useState('all');
  const [catListStatus, setCatListStatus] = React.useState('all');
  const [catListAssignment, setCatListAssignment] = React.useState('all');
  const [catListHierarchy, setCatListHierarchy] = React.useState('all');
  const [catListSort, setCatListSort] = React.useState('order');
  const [catListPage, setCatListPage] = React.useState(1);
  const debouncedCatListSearch = useDebouncedValue(catListSearch, 300);
  const [categoryListData, setCategoryListData] = React.useState({
    rows: [] as any[],
    total: 0,
    page: 1,
    pageCount: 1,
  });
  const [categoryListLoading, setCategoryListLoading] = React.useState(false);
  const [categoryListError, setCategoryListError] = React.useState<string | null>(null);
  const [categoryListReloadToken, setCategoryListReloadToken] = React.useState(0);
  const categoryListRequestRef = React.useRef(0);

  const [prodListSearch, setProdListSearch] = React.useState('');
  const [prodListStatus, setProdListStatus] = React.useState('all');
  const [prodListSection, setProdListSection] = React.useState('all');
  const [prodListCategory, setProdListCategory] = React.useState('all');
  const [prodListStock, setProdListStock] = React.useState('all');
  const [prodListSort, setProdListSort] = React.useState('newest');
  const [prodListPage, setProdListPage] = React.useState(1);
  const debouncedProdListSearch = useDebouncedValue(prodListSearch, 300);
  const [productListData, setProductListData] = React.useState({
    rows: [] as any[],
    total: 0,
    page: 1,
    pageCount: 1,
  });
  const [productListLoading, setProductListLoading] = React.useState(false);
  const [productListError, setProductListError] = React.useState<string | null>(null);
  const [productListReloadToken, setProductListReloadToken] = React.useState(0);
  const productListRequestRef = React.useRef(0);

  const [svcListSearch, setSvcListSearch] = React.useState('');
  const [svcListStatus, setSvcListStatus] = React.useState('all');
  const [svcListCategory, setSvcListCategory] = React.useState('all');
  const [svcListSort, setSvcListSort] = React.useState('order');
  const [svcListPage, setSvcListPage] = React.useState(1);

  const [testListSearch, setTestListSearch] = React.useState('');
  const [testListStatus, setTestListStatus] = React.useState('all');
  const [testListSort, setTestListSort] = React.useState('order');
  const [testListPage, setTestListPage] = React.useState(1);

  const [faqListSearch, setFaqListSearch] = React.useState('');
  const [faqListCategory, setFaqListCategory] = React.useState('all');
  const [faqListStatus, setFaqListStatus] = React.useState('all');
  const [faqListSort, setFaqListSort] = React.useState('order');
  const [faqListPage, setFaqListPage] = React.useState(1);

  // ==================================================
  // FAQS STATE
  // ==================================================
  const [faqs, setFaqs] = React.useState<any[]>([]);
  const [faqQ, setFaqQ] = React.useState('');
  const [faqA, setFaqA] = React.useState('');
  const [faqCategory, setFaqCategory] = React.useState('General');
  const [faqOrder, setFaqOrder] = React.useState('0');
  const [faqIsPublished, setFaqIsPublished] = React.useState(true);

  // ==================================================
  // SITE SETTINGS STATE
  // ==================================================
  const [settings, setSettings] = React.useState<any[]>([]);
  const [setKey, setSetKey] = React.useState('');
  const [setValue, setSetValue] = React.useState('');
  const [settingsSearch, setSettingsSearch] = React.useState('');
  const [settingsPage, setSettingsPage] = React.useState(1);

  // ==================================================
  // INQUIRIES / LEADS STATE
  // ==================================================
  const [inquiries, setInquiries] = React.useState<any[]>([]);
  const [inquiryStatusFilter, setInquiryStatusFilter] = React.useState<string>('all');
  const [inquiryDivisionFilter, setInquiryDivisionFilter] = React.useState<string>('all');
  const [inquirySearch, setInquirySearch] = React.useState('');
  const [inquirySort, setInquirySort] = React.useState('newest');
  const [inquiryPage, setInquiryPage] = React.useState(1);
  const [editingNotesId, setEditingNotesId] = React.useState<string | null>(null);
  const [currentNotesText, setCurrentNotesText] = React.useState<string>('');

  const mappedCategories = React.useMemo(() => categories.map((row) => mapCategoryRow(row)), [categories]);
  const validCategories = getValidCategories(mappedCategories, false);
  const productCategoryOptions = validCategories.filter((category) => (category.mainSection || '') === prodSection);
  const editedCategory = mappedCategories.find((category) => category.id === editingId);
  const excludedParents = editedCategory ? getDescendantSlugs(mappedCategories, editedCategory.slug) : new Set<string>();
  const parentOptions = validCategories.filter((category) =>
    (category.mainSection || '') === catSection && !excludedParents.has(category.slug));

  const metalCategoryOptions = React.useMemo(
    () => getMetalCategoryPickerOptions(validCategories),
    [validCategories]
  );
  const filteredMetalCategoryOptions = React.useMemo(() => {
    const query = svcCategorySearch.trim().toLowerCase();
    if (!query) return metalCategoryOptions;
    return metalCategoryOptions.filter((option) =>
      `${option.name} ${option.slug} ${option.path}`.toLowerCase().includes(query)
    );
  }, [metalCategoryOptions, svcCategorySearch]);

  const relationshipControlsReady =
    serviceCategorySupported === true && (!editingId || serviceCategoryLinksLoaded);

  const showCategoryServiceAssignments =
    catSection === 'metal_services' ||
    (editingId !== null && (catServiceBaseline?.length ?? 0) > 0);

  const relatedCategoryCountForService = (serviceId: string) =>
    serviceCategoryLinks.filter((link) => link.service_id === serviceId).length;
  const relatedServiceCountForCategory = (categoryId: string) =>
    serviceCategoryLinks.filter((link) => link.category_id === categoryId).length;

  const productListCategoryOptions = React.useMemo(
    () =>
      validCategories.filter((category) => {
        if (prodListSection === 'all') return true;
        if (prodListSection === 'legacy') {
          return !category.mainSection;
        }
        return category.mainSection === prodListSection;
      }),
    [validCategories, prodListSection]
  );

  React.useEffect(() => {
    if (activeTab !== 'categories') return;
    const requestId = ++categoryListRequestRef.current;
    const serviceId = catListAssignment.startsWith('service:')
      ? catListAssignment.slice('service:'.length)
      : undefined;

    setCategoryListLoading(true);
    setCategoryListError(null);

    getCategoriesAdminPage({
      search: debouncedCatListSearch,
      section: catListSection as 'all' | 'home_decor' | 'metal_services' | 'legacy',
      status: catListStatus as 'all' | 'published' | 'draft',
      serviceAssignment:
        catListAssignment === 'assigned' || catListAssignment === 'unassigned'
          ? catListAssignment
          : 'all',
      serviceId,
      hierarchy: catListHierarchy as 'all' | 'top' | 'child',
      sort: catListSort as 'order' | 'name' | 'newest',
      page: catListPage,
      pageSize: ADMIN_LIST_PAGE_SIZE,
    })
      .then((result) => {
        if (categoryListRequestRef.current !== requestId) return;
        setCategoryListData(result);
        if (result.total > 0 && result.page > result.pageCount) {
          setCatListPage(result.pageCount);
        }
      })
      .catch((error: unknown) => {
        if (categoryListRequestRef.current !== requestId) return;
        setCategoryListData({ rows: [], total: 0, page: 1, pageCount: 1 });
        setCategoryListError(
          error instanceof Error ? error.message : 'Categories could not be loaded.'
        );
      })
      .finally(() => {
        if (categoryListRequestRef.current === requestId) setCategoryListLoading(false);
      });
  }, [
    activeTab,
    debouncedCatListSearch,
    catListSection,
    catListStatus,
    catListAssignment,
    catListHierarchy,
    catListSort,
    catListPage,
    categoryListReloadToken,
  ]);

  React.useEffect(() => {
    if (activeTab !== 'products') return;
    const requestId = ++productListRequestRef.current;

    setProductListLoading(true);
    setProductListError(null);

    getProductsAdminPage({
      search: debouncedProdListSearch,
      division: prodListSection as 'all' | 'home_decor' | 'metal_services' | 'legacy',
      categoryId: prodListCategory === 'all' ? undefined : prodListCategory,
      status: prodListStatus as 'all' | 'published' | 'draft',
      stock: prodListStock,
      sort: prodListSort as 'newest' | 'order' | 'name' | 'sku',
      page: prodListPage,
      pageSize: ADMIN_LIST_PAGE_SIZE,
    })
      .then((result) => {
        if (productListRequestRef.current !== requestId) return;
        setProductListData(result);
        if (result.total > 0 && result.page > result.pageCount) {
          setProdListPage(result.pageCount);
        }
      })
      .catch((error: unknown) => {
        if (productListRequestRef.current !== requestId) return;
        setProductListData({ rows: [], total: 0, page: 1, pageCount: 1 });
        setProductListError(
          error instanceof Error ? error.message : 'Products could not be loaded.'
        );
      })
      .finally(() => {
        if (productListRequestRef.current === requestId) setProductListLoading(false);
      });
  }, [
    activeTab,
    debouncedProdListSearch,
    prodListSection,
    prodListCategory,
    prodListStatus,
    prodListStock,
    prodListSort,
    prodListPage,
    productListReloadToken,
  ]);

  const pagedCategories = categoryListData.rows;
  const categoryListPageCount = categoryListData.pageCount;
  const safeCategoryListPage = categoryListData.page;
  const pagedProducts = productListData.rows;
  const productListPageCount = productListData.pageCount;
  const safeProductListPage = productListData.page;

  const filteredServices = React.useMemo(() => {
    const rows = services.filter((service) => {
      const statusMatch =
        svcListStatus === 'all' ||
        (svcListStatus === 'published' ? service.is_published : !service.is_published);
      const searchMatch = matchesAdminSearch(svcListSearch, [
        service.name,
        service.slug,
        service.short_name,
        service.description,
      ]);
      const serviceLinks = serviceCategoryLinks.filter(
        (link) => link.service_id === service.id
      );
      const categoryMatch =
        svcListCategory === 'all' ||
        (svcListCategory === 'unassigned'
          ? serviceLinks.length === 0
          : serviceLinks.some((link) => link.category_id === svcListCategory));
      return statusMatch && searchMatch && categoryMatch;
    });

    return [...rows].sort((a, b) => {
      if (svcListSort === 'name') return String(a.name).localeCompare(String(b.name));
      return Number(a.display_order ?? 0) - Number(b.display_order ?? 0);
    });
  }, [
    services,
    svcListStatus,
    svcListSearch,
    svcListCategory,
    svcListSort,
    serviceCategoryLinks,
  ]);

  const serviceListPageCount = getAdminPageCount(
    filteredServices.length,
    ADMIN_LIST_PAGE_SIZE
  );
  const safeServiceListPage = Math.min(svcListPage, serviceListPageCount);
  const pagedServices = getAdminPageSlice(
    filteredServices,
    safeServiceListPage,
    ADMIN_LIST_PAGE_SIZE
  );

  const filteredTestimonials = React.useMemo(() => {
    const rows = testimonials.filter((testimonial) => {
      const statusMatch =
        testListStatus === 'all' ||
        (testListStatus === 'published'
          ? testimonial.is_published
          : !testimonial.is_published);
      const searchMatch = matchesAdminSearch(testListSearch, [
        testimonial.name,
        testimonial.company,
        testimonial.role,
        testimonial.content,
      ]);
      return statusMatch && searchMatch;
    });

    return [...rows].sort((a, b) => {
      if (testListSort === 'name') return String(a.name).localeCompare(String(b.name));
      if (testListSort === 'rating') return Number(b.rating ?? 0) - Number(a.rating ?? 0);
      return Number(a.display_order ?? 0) - Number(b.display_order ?? 0);
    });
  }, [testimonials, testListStatus, testListSearch, testListSort]);

  const testimonialListPageCount = getAdminPageCount(
    filteredTestimonials.length,
    ADMIN_LIST_PAGE_SIZE
  );
  const safeTestimonialListPage = Math.min(testListPage, testimonialListPageCount);
  const pagedTestimonials = getAdminPageSlice(
    filteredTestimonials,
    safeTestimonialListPage,
    ADMIN_LIST_PAGE_SIZE
  );

  const faqCategories = React.useMemo(
    () =>
      Array.from(
        new Set(faqs.map((faq) => String(faq.category || 'General')))
      ).sort((a, b) => a.localeCompare(b)),
    [faqs]
  );

  const filteredFaqs = React.useMemo(() => {
    const rows = faqs.filter((faq) => {
      const categoryMatch =
        faqListCategory === 'all' || String(faq.category || 'General') === faqListCategory;
      const statusMatch =
        faqListStatus === 'all' ||
        (faqListStatus === 'published' ? faq.is_published : !faq.is_published);
      const searchMatch = matchesAdminSearch(faqListSearch, [
        faq.question,
        faq.answer,
        faq.category,
      ]);
      return categoryMatch && statusMatch && searchMatch;
    });

    return [...rows].sort((a, b) => {
      if (faqListSort === 'question') {
        return String(a.question).localeCompare(String(b.question));
      }
      return Number(a.display_order ?? 0) - Number(b.display_order ?? 0);
    });
  }, [faqs, faqListCategory, faqListStatus, faqListSearch, faqListSort]);

  const faqListPageCount = getAdminPageCount(filteredFaqs.length, ADMIN_LIST_PAGE_SIZE);
  const safeFaqListPage = Math.min(faqListPage, faqListPageCount);
  const pagedFaqs = getAdminPageSlice(
    filteredFaqs,
    safeFaqListPage,
    ADMIN_LIST_PAGE_SIZE
  );

  const filteredInquiries = React.useMemo(() => {
    const rows = inquiries.filter((inquiry) => {
      const divisionMatch =
        inquiryDivisionFilter === 'all' || inquiry.division === inquiryDivisionFilter;
      const statusMatch =
        inquiryStatusFilter === 'all' || inquiry.status === inquiryStatusFilter;
      const searchMatch = matchesAdminSearch(inquirySearch, [
        inquiry.name,
        inquiry.email,
        inquiry.phone,
        inquiry.message,
        inquiry.productNameSnapshot,
        inquiry.serviceNameSnapshot,
        inquiry.adminNotes,
      ]);
      return divisionMatch && statusMatch && searchMatch;
    });

    return [...rows].sort((a, b) => {
      if (inquirySort === 'oldest') {
        return String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''));
      }
      if (inquirySort === 'status') {
        return String(a.status ?? '').localeCompare(String(b.status ?? ''));
      }
      if (inquirySort === 'name') {
        return String(a.name ?? '').localeCompare(String(b.name ?? ''));
      }
      return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
    });
  }, [
    inquiries,
    inquiryDivisionFilter,
    inquiryStatusFilter,
    inquirySearch,
    inquirySort,
  ]);

  const inquiryListPageCount = getAdminPageCount(
    filteredInquiries.length,
    ADMIN_LIST_PAGE_SIZE
  );
  const safeInquiryListPage = Math.min(inquiryPage, inquiryListPageCount);
  const pagedInquiries = getAdminPageSlice(
    filteredInquiries,
    safeInquiryListPage,
    ADMIN_LIST_PAGE_SIZE
  );

  const filteredSettings = React.useMemo(
    () =>
      settings.filter((setting) =>
        matchesAdminSearch(settingsSearch, [
          setting.key,
          JSON.stringify(setting.value),
        ])
      ),
    [settings, settingsSearch]
  );

  const settingsListPageCount = getAdminPageCount(
    filteredSettings.length,
    ADMIN_LIST_PAGE_SIZE
  );
  const safeSettingsListPage = Math.min(settingsPage, settingsListPageCount);
  const pagedSettings = getAdminPageSlice(
    filteredSettings,
    safeSettingsListPage,
    ADMIN_LIST_PAGE_SIZE
  );

  // After a concurrency conflict we reload the latest links and reset the form
  // to that saved state, so the admin reviews it instead of overwriting it.
  const syncServiceRelationshipState = (
    serviceId: string,
    links: ServiceCategoryLinkRow[]
  ) => {
    const ids = normalizeIdList(
      links.filter((link) => link.service_id === serviceId).map((link) => link.category_id)
    );
    setSvcCategoryIds(ids);
    setSvcCategoryBaseline(ids);
  };

  const syncCategoryServiceState = (
    categoryId: string,
    links: ServiceCategoryLinkRow[]
  ) => {
    const ids = normalizeIdList(
      links.filter((link) => link.category_id === categoryId).map((link) => link.service_id)
    );
    setCatServiceIds(ids);
    setCatServiceBaseline(ids);
  };

  const loadAllData = React.useCallback(async () => {
    setLoading(true);
    const loadErrors: string[] = [];
    const loadedRelationships = {
      relationshipLinks: [] as ServiceCategoryLinkRow[],
      relationshipLinksLoaded: false,
    };
    const loadOr = async <T,>(label: string, task: Promise<T>, fallback: T): Promise<T> => {
      try {
        return await task;
      } catch (error) {
        loadErrors.push(
          `${label}: ${error instanceof Error ? error.message : 'unknown error'}`
        );
        return fallback;
      }
    };

    try {
      const [catList, prodList, svcList, testList, faqList, setList, inqList, supportsHierarchy, beforeAfterTotal, metalFinishTotal] = await Promise.all([
        getCategoriesAdmin(),
        loadOr('Products', getProductsAdmin(), []),
        loadOr('Services', getServicesAdmin(), []),
        loadOr('Testimonials', getTestimonialsAdmin(), []),
        loadOr('FAQs', getFaqsAdmin(), []),
        loadOr('Site settings', getSiteSettingsAdmin(), []),
        loadOr('Inquiries', getInquiriesAdmin(), []),
        getCategoryHierarchySupportAdmin(),
        loadOr('Before & After', getBeforeAfterCountAdmin(), 0),
        loadOr('Metal Finishes', getMetalFinishCountAdmin(), 0),
      ]);

      let supportsServiceCategories = false;
      try {
        supportsServiceCategories = await getServiceCategorySupportAdmin();
      } catch (error) {
        loadErrors.push(
          `Service-category schema: ${error instanceof Error ? error.message : 'unknown error'}`
        );
      }

      let relationshipLinks: ServiceCategoryLinkRow[] = [];
      let relationshipLinksLoaded = false;
      let relationshipLinksError: string | null = null;
      if (supportsServiceCategories) {
        try {
          relationshipLinks = await getServiceCategoryLinksAdmin();
          relationshipLinksLoaded = true;
        } catch (error) {
          relationshipLinksError =
            error instanceof Error ? error.message : 'Unknown relationship load error';
          loadErrors.push(`Service-category links: ${relationshipLinksError}`);
        }
      }

      setCategories(catList);
      setCategoryListReloadToken((token) => token + 1);
      setHierarchySupported(supportsHierarchy);
      setProducts(prodList);
      setProductListReloadToken((token) => token + 1);
      setServices(svcList);
      setTestimonials(testList);
      setFaqs(faqList);
      setSettings(setList);
      setInquiries(inqList);
      setBeforeAfterCount(beforeAfterTotal);
      setMetalFinishCount(metalFinishTotal);
      setServiceCategorySupported(supportsServiceCategories);
      setServiceCategoryLinks(relationshipLinks);
      setServiceCategoryLinksLoaded(relationshipLinksLoaded);
      setServiceCategoryLinksError(relationshipLinksError);

      if (loadErrors.length > 0) {
        setMessage({
          type: 'error',
          text: `Some admin data could not be loaded. ${loadErrors.join(' | ')}`,
        });
      }

      loadedRelationships.relationshipLinks = relationshipLinks;
      loadedRelationships.relationshipLinksLoaded = relationshipLinksLoaded;
      return loadedRelationships;
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load catalog data' });
      return loadedRelationships;
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ==================================================
  // IMAGE OPTIMIZATION / UPLOAD HELPERS
  // ==================================================
  const createUploadId = () =>
    `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const trackPreviewUrl = (url: string) => {
    previewObjectUrlsRef.current.add(url);
    return url;
  };

  const releasePreviewUrl = (url?: string) => {
    if (!url || !url.startsWith('blob:')) return;
    if (!previewObjectUrlsRef.current.has(url)) return;
    URL.revokeObjectURL(url);
    previewObjectUrlsRef.current.delete(url);
  };

  const updateSingleUpload = (id: string, patch: Partial<ImageUploadItem>) => {
    if (!mountedRef.current) return;
    setSingleUpload((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  };

  const updateGalleryUpload = (id: string, patch: Partial<ImageUploadItem>) => {
    if (!mountedRef.current) return;
    setGalleryUploads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const clearUploadState = () => {
    uploadControllersRef.current.forEach((controller) => controller.abort());
    uploadControllersRef.current.clear();
    previewObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewObjectUrlsRef.current.clear();
    gallerySourceRef.current.clear();
    singleSourceRef.current = null;
    setSingleUpload(null);
    setGalleryUploads([]);
  };

  React.useEffect(() => {
    mountedRef.current = true;
    const controllers = uploadControllersRef.current;
    const previewUrls = previewObjectUrlsRef.current;
    const gallerySources = gallerySourceRef.current;
    const singleSource = singleSourceRef;

    return () => {
      mountedRef.current = false;
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.clear();
      gallerySources.clear();
      singleSource.current = null;
    };
  }, []);

  /**
   * Optimize a single image first, then upload the optimized file.
   * The original file is never uploaded or modified.
   */
  const handleFileUpload = async (
    file: File,
    targetSetter: (url: string) => void,
    purpose: ImagePurpose,
    target: ImageUploadTarget
  ) => {
    if (!file) return;
    if (uploading || loading) {
      setMessage({ type: 'error', text: 'Please wait for the current operation to finish.' });
      return;
    }

    const id = createUploadId();
    const controller = new AbortController();
    uploadControllersRef.current.set(id, controller);
    singleSourceRef.current = { file, setter: targetSetter, purpose, target };
    releasePreviewUrl(singleUpload?.previewUrl);
    setUploading(true);
    setMessage(null);
    setSingleUpload({
      id,
      target,
      purpose,
      fileName: file.name,
      status: 'preparing',
      progress: 0,
      originalSize: file.size,
    });

    try {
      updateSingleUpload(id, { status: 'compressing', progress: 1 });

      const prepared = await prepareImageUpload(file, purpose, {
        signal: controller.signal,
        onProgress: (progress) => updateSingleUpload(id, { status: 'compressing', progress }),
      });

      if (controller.signal.aborted) {
        throw new ImagePreparationError('cancelled', 'Image upload cancelled.');
      }

      const previewUrl = trackPreviewUrl(URL.createObjectURL(prepared.file));
      updateSingleUpload(id, {
        status: 'ready',
        progress: 100,
        optimizedSize: prepared.optimizedSize,
        previewUrl,
      });

      updateSingleUpload(id, { status: 'uploading' });
      const publicUrl = await uploadCatalogImage(prepared.file);

      if (controller.signal.aborted) {
        throw new ImagePreparationError('cancelled', 'Image upload cancelled.');
      }

      if (!mountedRef.current) {
        releasePreviewUrl(previewUrl);
        return;
      }

      targetSetter(publicUrl);
      updateSingleUpload(id, { status: 'uploaded', previewUrl: publicUrl });
      releasePreviewUrl(previewUrl);
      singleSourceRef.current = null;
      setMessage({
        type: 'success',
        text: `Image optimized from ${formatBytes(prepared.originalSize)} to ${formatBytes(
          prepared.optimizedSize
        )} (${prepared.savedPercent}% smaller) and uploaded.`,
      });
    } catch (error: any) {
      const cancelled =
        controller.signal.aborted ||
        (error instanceof ImagePreparationError && error.code === 'cancelled');
      const text = cancelled ? 'Image upload cancelled.' : getImageErrorMessage(error);

      if (mountedRef.current) {
        updateSingleUpload(id, {
          status: cancelled ? 'cancelled' : 'failed',
          error: text,
        });
        setMessage({ type: 'error', text });
      }
    } finally {
      uploadControllersRef.current.delete(id);
      if (mountedRef.current) setUploading(false);
    }
  };

  const retrySingleUpload = () => {
    const source = singleSourceRef.current;
    if (!source || uploading || loading) return;
    void handleFileUpload(source.file, source.setter, source.purpose, source.target);
  };

  const cancelSingleUpload = (id: string) => {
    uploadControllersRef.current.get(id)?.abort();
  };

  const dismissSingleUpload = (id: string) => {
    if (singleUpload?.id !== id || isImageUploadActive(singleUpload)) return;
    releasePreviewUrl(singleUpload.previewUrl);
    setSingleUpload(null);
    singleSourceRef.current = null;
  };

  /**
   * Optimize and upload one gallery image. Failures are isolated so one bad
   * file cannot discard the rest of a multi-image selection.
   */
  const processGalleryEntry = async (
    id: string,
    file: File,
    controller: AbortController
  ): Promise<boolean> => {
    uploadControllersRef.current.set(id, controller);

    try {
      if (controller.signal.aborted) {
        throw new ImagePreparationError('cancelled', 'Image upload cancelled.');
      }

      updateGalleryUpload(id, {
        status: 'compressing',
        progress: 1,
        error: undefined,
      });

      const prepared = await prepareImageUpload(file, 'product-gallery', {
        signal: controller.signal,
        onProgress: (progress) =>
          updateGalleryUpload(id, { status: 'compressing', progress }),
      });

      if (controller.signal.aborted) {
        throw new ImagePreparationError('cancelled', 'Image upload cancelled.');
      }

      const previewUrl = trackPreviewUrl(URL.createObjectURL(prepared.file));
      updateGalleryUpload(id, {
        status: 'ready',
        progress: 100,
        optimizedSize: prepared.optimizedSize,
        previewUrl,
      });

      updateGalleryUpload(id, { status: 'uploading' });
      const publicUrl = await uploadCatalogImage(prepared.file);

      if (controller.signal.aborted) {
        throw new ImagePreparationError('cancelled', 'Image upload cancelled.');
      }

      if (!mountedRef.current) {
        releasePreviewUrl(previewUrl);
        return false;
      }

      setProdGalleryImages((prev) => {
        const combined = [
          ...prev,
          {
            id: '',
            productId: '',
            imageUrl: publicUrl,
            altText: '',
            sortOrder: prev.length,
            isPrimary: false,
          },
        ];
        return combined.map((img, index) => ({ ...img, sortOrder: index }));
      });

      updateGalleryUpload(id, {
        status: 'uploaded',
        previewUrl: publicUrl,
        optimizedSize: prepared.optimizedSize,
      });
      releasePreviewUrl(previewUrl);
      gallerySourceRef.current.delete(id);
      return true;
    } catch (error: any) {
      const cancelled =
        controller.signal.aborted ||
        (error instanceof ImagePreparationError && error.code === 'cancelled');
      const text = cancelled ? 'Image upload cancelled.' : getImageErrorMessage(error);

      if (mountedRef.current) {
        updateGalleryUpload(id, {
          status: cancelled ? 'cancelled' : 'failed',
          error: text,
        });
      }
      return false;
    } finally {
      uploadControllersRef.current.delete(id);
    }
  };

  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Copy the FileList before resetting the input. Assigning value = '' clears
    // the live FileList, which previously made every multi-file selection empty.
    const files = copySelectedFilesAndReset(e.target);
    if (files.length === 0) return;

    if (uploading || loading) {
      setMessage({ type: 'error', text: 'Please wait for the current operation to finish.' });
      return;
    }

    if (editingId && galleryLoadedProductIdRef.current !== editingId) {
      setMessage({
        type: 'error',
        text: 'The saved gallery has not loaded for this product. Reopen the product before adding images.',
      });
      return;
    }

    setUploading(true);
    setMessage(null);

    const entries = files.map((file) => {
      const id = createUploadId();
      const controller = new AbortController();
      gallerySourceRef.current.set(id, file);
      uploadControllersRef.current.set(id, controller);
      return { id, file, controller };
    });

    setGalleryUploads((prev) => [
      ...prev,
      ...entries.map<ImageUploadItem>(({ id, file }) => ({
        id,
        target: 'product-gallery',
        purpose: 'product-gallery',
        fileName: file.name,
        status: 'preparing',
        progress: 0,
        originalSize: file.size,
      })),
    ]);

    let uploadedCount = 0;
    let failedCount = 0;

    await runWithConcurrency(entries, UPLOAD_CONCURRENCY, async (entry) => {
      const ok = await processGalleryEntry(entry.id, entry.file, entry.controller);
      if (ok) uploadedCount += 1;
      else failedCount += 1;
    });

    if (mountedRef.current) {
      setUploading(false);
      if (uploadedCount > 0 && failedCount === 0) {
        setMessage({
          type: 'success',
          text: `${uploadedCount} gallery image${uploadedCount === 1 ? '' : 's'} optimized and uploaded.`,
        });
      } else if (uploadedCount > 0) {
        setMessage({
          type: 'error',
          text: `${uploadedCount} uploaded, ${failedCount} failed. Retry failed images below before saving.`,
        });
      } else if (failedCount > 0) {
        setMessage({
          type: 'error',
          text: 'Gallery upload failed. Retry or remove the failed images below.',
        });
      }
    }
  };

  const retryGalleryUpload = async (id: string) => {
    const file = gallerySourceRef.current.get(id);
    if (!file || uploading || loading) return;

    const existing = galleryUploads.find((item) => item.id === id);
    if (!existing) return;

    releasePreviewUrl(existing.previewUrl);
    const controller = new AbortController();
    setUploading(true);
    setMessage(null);
    updateGalleryUpload(id, {
      status: 'preparing',
      progress: 0,
      optimizedSize: undefined,
      previewUrl: undefined,
      error: undefined,
    });

    const ok = await processGalleryEntry(id, file, controller);
    if (mountedRef.current) {
      setUploading(false);
      setMessage(
        ok
          ? { type: 'success', text: `"${existing.fileName}" optimized and uploaded.` }
          : { type: 'error', text: `"${existing.fileName}" could not be uploaded.` }
      );
    }
  };

  const cancelGalleryUpload = (id: string) => {
    uploadControllersRef.current.get(id)?.abort();
  };

  const dismissGalleryUpload = (id: string) => {
    const item = galleryUploads.find((entry) => entry.id === id);
    if (!item || isImageUploadActive(item)) return;
    releasePreviewUrl(item.previewUrl);
    gallerySourceRef.current.delete(id);
    setGalleryUploads((prev) => prev.filter((entry) => entry.id !== id));
  };

  const removeGalleryImage = (index: number) => {
    const removed = prodGalleryImages[index];
    if (removed?.id) {
      removedGalleryIdsRef.current.add(removed.id);
    }
    setProdGalleryImages(prev => prev.filter((_, i) => i !== index));
    if (removed) {
      setGalleryUploads((prev) =>
        prev.filter(
          (item) => !(item.status === 'uploaded' && item.previewUrl === removed.imageUrl)
        )
      );
    }
  };

  const moveGalleryImage = (index: number, direction: 'up' | 'down') => {
    setProdGalleryImages(prev => {
      const newArr = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newArr.length) return prev;
      [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
      return newArr.map((img, idx) => ({ ...img, sortOrder: idx }));
    });
  };

  const loadProductGallery = (
    productId: string,
    rows: DatabaseProductImageRow[] | null | undefined
  ) => {
    const images = sortGalleryImages((rows ?? []).map(mapProductImageRow));
    galleryBaselineRef.current = images;
    galleryLoadedProductIdRef.current = productId;
    removedGalleryIdsRef.current.clear();
    setProdGalleryImages(images);
  };

  const applyGallerySyncResult = (
    productId: string,
    result: Awaited<ReturnType<typeof syncProductGalleryImages>>
  ) => {
    galleryBaselineRef.current = result.savedImages;
    galleryLoadedProductIdRef.current = productId;
    result.deletedIds.forEach((id) => removedGalleryIdsRef.current.delete(id));
    setProdGalleryImages((prev) => mergeGallerySyncResult(prev, result));
  };

  const verifySavedGallery = async (productId: string, expected: ProductImage[]) => {
    const verified = await getProductGalleryImages(productId);
    galleryBaselineRef.current = verified;
    galleryLoadedProductIdRef.current = productId;
    setProdGalleryImages(verified);
    const verifiedUrls = new Set(verified.map((image) => image.imageUrl));
    return expected.filter(
      (image) => image.imageUrl && !verifiedUrls.has(image.imageUrl)
    );
  };

  // Reset Forms
  const resetForms = () => {
    clearUploadState();
    galleryBaselineRef.current = [];
    galleryLoadedProductIdRef.current = null;
    removedGalleryIdsRef.current.clear();
    setEditingId(null);
    setCatSection(''); setCatParentId(''); setCatIsPublished(false);
    setProdSection(''); setProdCatId('');
    setCatName(''); setCatSlug(''); setCatTagline(''); setCatDesc(''); setCatImage(''); setCatIsFeatured(false); setCatOrder('0');
    setProdName(''); setProdSlug(''); setProdSku(''); setProdSubCat(''); setProdImage(''); setProdBadge(''); setProdShortDesc(''); setProdFullDesc(''); setProdMaterial(''); setProdColorFinish(''); setProdDimensions(''); setProdWeight(''); setProdStockStatus('in_stock'); setProdFeatures(''); setProdCareInstructions(''); setProdIsPublished(false); setProdIsFeatured(false);
    setProdOrder('0');
    setProdGalleryImages([]);
    setSvcName(''); setSvcSlug(''); setSvcShortName(''); setSvcDesc(''); setSvcLongDesc(''); setSvcImage(''); setSvcFeatures(''); setSvcApplications(''); setSvcProcessSteps(''); setSvcOrder('0'); setSvcIsPublished(false);
    setSvcCategoryIds([]); setSvcCategoryBaseline([]); setSvcCategorySearch('');
    setCatServiceIds([]); setCatServiceBaseline([]);
    setTestName(''); setTestCompany(''); setTestRole(''); setTestContent(''); setTestRating('5'); setTestAvatar(''); setTestOrder('0'); setTestIsPublished(true);
    setFaqQ(''); setFaqA(''); setFaqCategory('General'); setFaqOrder('0'); setFaqIsPublished(true);
    setSetKey(''); setSetValue('');
  };

  // CATEGORIES SUBMIT
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || uploading) return;
    if (!catName || !catSlug) return;
    if (hierarchySupported === null || (!editingId && (!hierarchySupported || !catSection))) {
      setMessage({ type: 'error', text: 'Creating a category requires the hierarchy schema and an explicit main section.' });
      return;
    }

    const isMetalCategory = catSection === 'metal_services';
    const knownServiceAssignments = catServiceBaseline ?? [];

    if (editingId && !isMetalCategory && catServiceBaseline === null) {
      setMessage({
        type: 'error',
        text: 'Applicable Metal Services could not be loaded. Refresh and reopen this category before changing its main section.',
      });
      return;
    }

    if (editingId && !isMetalCategory && knownServiceAssignments.length > 0) {
      setMessage({
        type: 'error',
        text: 'This category still has Metal service assignments. Keep Main Section set to Metal, save with N/A — No Service Assigned to remove the links, then change the main section.',
      });
      return;
    }

    const validServiceIds = new Set(services.map((service) => service.id));
    if (isMetalCategory && catServiceIds.some((id) => !validServiceIds.has(id))) {
      setMessage({ type: 'error', text: 'Choose only existing services for Applicable Metal Services.' });
      return;
    }

    const shouldSaveRelationships =
      isMetalCategory && serviceCategorySupported === true && relationshipControlsReady;
    const relationshipsNeedRefresh =
      isMetalCategory && serviceCategorySupported === true && editingId !== null && !serviceCategoryLinksLoaded;

    setLoading(true);
    let detailsSaved = false;
    let categoryId: string | null = editingId;

    try {
      const payload = {
        name: catName,
        slug: catSlug,
        tagline: catTagline,
        description: catDesc,
        image: catImage || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
        is_featured: catIsFeatured,
        display_order: parseInt(catOrder) || 0,
        ...(hierarchySupported ? {
          main_section: catSection || null,
          parent_id: catParentId || null,
          is_published: catIsPublished,
        } : {}),
      };

      if (editingId) {
        await updateCategoryAdmin(editingId, payload);
        detailsSaved = true;
        categoryId = editingId;
      } else {
        const created = await createCategoryAdmin(payload);
        detailsSaved = true;
        categoryId = created.id;
      }

      if (shouldSaveRelationships && categoryId) {
        await replaceCategoryServicesAdmin(
          categoryId,
          catServiceIds,
          editingId ? (catServiceBaseline ?? []) : []
        );
      }

      const completionNote = relationshipsNeedRefresh
        ? ' Category details were saved, but service assignments were not changed because they had not loaded. Refresh and reopen the category.'
        : !shouldSaveRelationships && isMetalCategory && serviceCategorySupported === false
          ? ' Service-category assignments require the approved database migration.'
          : '';

      setMessage({
        type: 'success',
        text: `${editingId ? 'Category updated' : 'Category created'} successfully!${completionNote}`,
      });
      resetForms();
      await loadAllData();
    } catch (err: any) {
      const errorMessage = getServiceCategoryErrorMessage(err);
      if (detailsSaved) {
        if (!editingId && categoryId) setEditingId(categoryId);
        setMessage({
          type: 'error',
          text: `Category details were saved, but Applicable Metal Services could not be updated: ${errorMessage}`,
        });
        if (isServiceCategoryConflict(err)) {
          const refreshed = await loadAllData();
          if (refreshed.relationshipLinksLoaded && categoryId) {
            syncCategoryServiceState(categoryId, refreshed.relationshipLinks);
          }
        }
      } else {
        setMessage({ type: 'error', text: errorMessage || 'Category action failed.' });
      }
      setLoading(false);
    }
  };

  // PRODUCTS SUBMIT (All 19 Fields Handled)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || uploading) return;
    if (!prodName || !prodSlug || !prodCatId) return;
    if (!productCategoryOptions.some((category) => category.id === prodCatId)) {
      setMessage({ type: 'error', text: 'Choose a valid category in the selected main section.' });
      return;
    }

    if (editingId && galleryLoadedProductIdRef.current !== editingId) {
      setMessage({
        type: 'error',
        text: 'The saved gallery has not loaded for this product. Reopen the product before saving.',
      });
      return;
    }

    setLoading(true);
    try {
      const featArr = prodFeatures ? prodFeatures.split('\\n').filter(Boolean) : [];
      const payload = {
        category_id: prodCatId,
        name: prodName,
        slug: prodSlug,
        sku: prodSku,
        sub_category: prodSubCat,
        price: null,
        // original_price omitted for enquiry-only catalogue
        image: prodImage || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
        badge: prodBadge || undefined,
        short_description: prodShortDesc,
        description: prodFullDesc || prodShortDesc || 'Crafted metal artifact',
        material: prodMaterial,
        color_finish: prodColorFinish,
        dimensions: prodDimensions,
        weight: prodWeight,
        stock_status: prodStockStatus,
        features: featArr,
        care_instructions: prodCareInstructions,
        is_published: prodIsPublished,
        is_featured: prodIsFeatured,
        display_order: parseInt(prodOrder) || 0,
      };

      if (editingId) {
        await updateProductAdmin(editingId, payload, prodSection || null);

        const result = await syncProductGalleryImages(
          editingId,
          prodGalleryImages,
          galleryBaselineRef.current,
          { removedIds: removedGalleryIdsRef.current }
        );
        applyGallerySyncResult(editingId, result);

        if (result.failures.length > 0) {
          await loadAllData();
          setMessage({
            type: 'error',
            text: `Product details were saved, but ${result.failures.length} gallery image${
              result.failures.length === 1 ? '' : 's'
            } could not be updated. ${result.failures[0].message} Retry before leaving this product.`,
          });
        } else {
          try {
            const missing = await verifySavedGallery(editingId, result.savedImages);
            if (missing.length > 0) {
              await loadAllData();
              setMessage({
                type: 'error',
                text: `Product details were saved, but ${missing.length} gallery image${
                  missing.length === 1 ? ' was' : 's were'
                } not found in the refreshed gallery. Retry before leaving this product.`,
              });
            } else {
              resetForms();
              await loadAllData();
              setMessage({ type: 'success', text: 'Product and gallery saved successfully.' });
            }
          } catch (verificationError: any) {
            await loadAllData();
            setMessage({
              type: 'error',
              text: `Product details were saved, but the gallery could not be verified: ${
                verificationError?.message || 'reload the product and check the images.'
              }`,
            });
          }
        }
      } else {
        const newProduct = await createProductAdmin(payload, prodSection || null);

        // The product now exists. Keep the form pointed at it so any gallery
        // failure retries through the update path instead of creating a duplicate.
        setEditingId(newProduct.id);
        galleryLoadedProductIdRef.current = newProduct.id;

        const result = await syncProductGalleryImages(
          newProduct.id,
          prodGalleryImages,
          [],
          { removedIds: removedGalleryIdsRef.current }
        );
        applyGallerySyncResult(newProduct.id, result);

        if (result.failures.length > 0) {
          await loadAllData();
          setMessage({
            type: 'error',
            text: `Product was created, but ${result.failures.length} gallery image${
              result.failures.length === 1 ? '' : 's'
            } could not be saved. ${result.failures[0].message} Retry before leaving this product.`,
          });
        } else {
          try {
            const missing = await verifySavedGallery(newProduct.id, result.savedImages);
            if (missing.length > 0) {
              await loadAllData();
              setMessage({
                type: 'error',
                text: `Product was created, but ${missing.length} gallery image${
                  missing.length === 1 ? ' was' : 's were'
                } not found in the refreshed gallery. Retry before leaving this product.`,
              });
            } else {
              resetForms();
              await loadAllData();
              setMessage({ type: 'success', text: 'Product and gallery created successfully.' });
            }
          } catch (verificationError: any) {
            await loadAllData();
            setMessage({
              type: 'error',
              text: `Product was created, but the gallery could not be verified: ${
                verificationError?.message || 'reopen the product and check the images.'
              }`,
            });
          }
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Product action failed.' });
    } finally {
      setLoading(false);
    }
  };

  // SERVICES SUBMIT
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || uploading) return;
    if (!svcName || !svcSlug || !svcDesc) return;

    // Image validation — must be non-empty and a valid URL or root-relative path
    const trimmedImage = svcImage ? svcImage.trim() : '';
    if (!trimmedImage) {
      setMessage({ type: 'error', text: 'Service image is required. Upload an image or enter a valid URL.' });
      return;
    }
    if (!trimmedImage.startsWith('https://') && !trimmedImage.startsWith('http://') && !trimmedImage.startsWith('/')) {
      setMessage({ type: 'error', text: 'Service image must be a valid URL (https://.) or a root-relative path (/uploads/.).' });
      return;
    }

    const validCategoryIds = new Set(
      mappedCategories
        .filter((category) => category.id && category.mainSection === 'metal_services')
        .map((category) => category.id!)
    );
    if (svcCategoryIds.some((id) => !validCategoryIds.has(id))) {
      setMessage({ type: 'error', text: 'Choose only Metal division categories for Related Metal Categories.' });
      return;
    }

    const shouldSaveRelationships =
      serviceCategorySupported === true && relationshipControlsReady;
    const relationshipsNeedRefresh =
      serviceCategorySupported === true && editingId !== null && !serviceCategoryLinksLoaded;

    setLoading(true);
    let detailsSaved = false;
    let serviceId: string | null = editingId;

    try {
      const featArr = svcFeatures ? svcFeatures.split('\n').filter(Boolean) : [];
      const appArr = svcApplications ? svcApplications.split('\n').filter(Boolean) : [];

      // Process steps: accept only a JSON array in the textarea (lossless round-trip).
      // Plain empty string → preserve existing DB value when editing, or send [] for new records.
      let processStepsValue: any[] | undefined = undefined;
      const trimmedSteps = svcProcessSteps.trim();
      if (trimmedSteps === '') {
        // No steps typed — for new records send []; for edits omit the field so DB value is unchanged.
        processStepsValue = editingId ? undefined : [];
      } else {
        let parsed: unknown;
        try {
          parsed = JSON.parse(trimmedSteps);
        } catch {
          setMessage({ type: 'error', text: 'Process Steps must be a valid JSON array, e.g. [{"title":"Step 1","description":"…"}].' });
          setLoading(false);
          return;
        }
        if (!Array.isArray(parsed)) {
          setMessage({ type: 'error', text: 'Process Steps must be a JSON array.' });
          setLoading(false);
          return;
        }
        processStepsValue = parsed as any[];
      }

      const basePayload = {
        name: svcName,
        slug: svcSlug,
        short_name: svcShortName || svcName,
        description: svcDesc,
        long_description: svcLongDesc || svcDesc,
        image: trimmedImage,
        features: featArr,
        applications: appArr,
        display_order: parseInt(svcOrder) || 0,
        is_published: svcIsPublished,
      };

      const payload = processStepsValue !== undefined
        ? { ...basePayload, process_steps: processStepsValue }
        : basePayload;

      if (editingId) {
        await updateServiceAdmin(editingId, payload);
        detailsSaved = true;
        serviceId = editingId;
      } else {
        const created = await createServiceAdmin({ ...payload, process_steps: processStepsValue ?? [] });
        detailsSaved = true;
        serviceId = created.id;
      }

      if (shouldSaveRelationships && serviceId) {
        await replaceServiceCategoriesAdmin(
          serviceId,
          svcCategoryIds,
          editingId ? (svcCategoryBaseline ?? []) : []
        );
      }

      const completionNote = relationshipsNeedRefresh
        ? ' Service details were saved, but related categories were not changed because they had not loaded. Refresh and reopen the service.'
        : serviceCategorySupported === false
          ? ' Related category assignments require the approved database migration.'
          : '';

      setMessage({
        type: 'success',
        text: `${editingId ? 'Service updated' : 'Service created'} successfully!${completionNote}`,
      });
      resetForms();
      await loadAllData();
    } catch (err: any) {
      const errorMessage = getServiceCategoryErrorMessage(err);
      if (detailsSaved) {
        if (!editingId && serviceId) setEditingId(serviceId);
        setMessage({
          type: 'error',
          text: `Service details were saved, but related categories could not be updated: ${errorMessage}`,
        });
        if (isServiceCategoryConflict(err)) {
          const refreshed = await loadAllData();
          if (refreshed.relationshipLinksLoaded && serviceId) {
            syncServiceRelationshipState(serviceId, refreshed.relationshipLinks);
          }
        }
      } else {
        setMessage({ type: 'error', text: errorMessage || 'Service action failed.' });
      }
      setLoading(false);
    }
  };

  // TESTIMONIALS SUBMIT
  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || uploading) return;
    if (!testName || !testContent) return;

    const rVal = parseInt(testRating) || 5;
    if (rVal < 1 || rVal > 5) {
      setMessage({ type: 'error', text: 'Rating must be between 1 and 5 stars.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: testName,
        company: testCompany,
        role: testRole,
        content: testContent,
        rating: rVal,
        avatar: testAvatar || undefined,
        display_order: parseInt(testOrder) || 0,
        is_published: testIsPublished,
      };

      if (editingId) {
        await updateTestimonialAdmin(editingId, payload);
        setMessage({ type: 'success', text: 'Testimonial updated successfully!' });
      } else {
        await createTestimonialAdmin(payload);
        setMessage({ type: 'success', text: 'Testimonial created successfully!' });
      }
      resetForms();
      await loadAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Testimonial action failed.' });
      setLoading(false);
    }
  };

  // FAQS SUBMIT
  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQ || !faqA) return;
    setLoading(true);
    try {
      const payload = {
        question: faqQ,
        answer: faqA,
        category: faqCategory,
        display_order: parseInt(faqOrder) || 0,
        is_published: faqIsPublished,
      };

      if (editingId) {
        await updateFaqAdmin(editingId, payload);
        setMessage({ type: 'success', text: 'FAQ updated successfully!' });
      } else {
        await createFaqAdmin(payload);
        setMessage({ type: 'success', text: 'FAQ created successfully!' });
      }
      resetForms();
      await loadAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'FAQ action failed.' });
      setLoading(false);
    }
  };

  // SITE SETTINGS SUBMIT
  const handleSettingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setKey || !setValue) return;
    setLoading(true);
    try {
      let parsedVal: any = setValue;
      try {
        parsedVal = JSON.parse(setValue);
      } catch {
        parsedVal = setValue;
      }
      await updateSiteSettingAdmin(setKey, parsedVal);
      setMessage({ type: 'success', text: 'Site setting saved successfully!' });
      resetForms();
      await loadAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Setting action failed.' });
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {message && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${message.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4 overflow-x-auto">
        {[
          { id: 'inquiries', label: 'Inquiries / Leads', icon: Inbox, count: inquiries.length },
          { id: 'categories', label: 'Categories', icon: FolderTree, count: categories.length },
          { id: 'products', label: 'Products', icon: Package, count: products.length },
          { id: 'services', label: 'Services', icon: Wrench, count: services.length },
          { id: 'testimonials', label: 'Testimonials', icon: MessageSquare, count: testimonials.length },
          { id: 'metal-finishes', label: 'Metal Finishes', icon: Layers, count: metalFinishCount },
          { id: 'before-after', label: 'Before & After', icon: Images, count: beforeAfterCount },
          { id: 'faqs', label: 'FAQs', icon: HelpCircle, count: faqs.length },
          { id: 'settings', label: 'Site Settings', icon: Settings, count: settings.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              resetForms();
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${activeTab === tab.id
              ? 'bg-gold-deep text-black font-bold shadow-lg'
              : 'bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
            <span className="ml-1.5 rounded-full bg-background/40 px-2 py-0.5 text-[10px]">
              {tab.count}
            </span>
          </button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={loadAllData}
          disabled={loading}
          className="ml-auto rounded-xl"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AdminFormPanel
            title={editingId ? 'Edit Category' : 'Add Category'}
            icon={<Plus className="h-4 w-4 text-gold-deep" />}
            formProps={{ onSubmit: handleCategorySubmit }}
            footer={
              <>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForms}
                    className="w-full sm:w-auto"
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    uploading ||
                    hierarchySupported === null ||
                    (!editingId && !hierarchySupported)
                  }
                  className="w-full gold-button font-medium sm:w-auto sm:min-w-[10rem]"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    'Update Category'
                  ) : (
                    'Save Category'
                  )}
                </Button>
              </>
            }
          >
              {hierarchySupported !== true && <p className="text-xs text-muted-foreground">
                {hierarchySupported === false ? 'Hierarchy columns are unavailable. Existing category details can be edited; new categories and hierarchy controls require the approved schema.' : 'Checking category schema…'}
              </p>}
              {hierarchySupported && <>
                <div>
                  <Label htmlFor="cat-section">Main Section *</Label>
                  <select id="cat-section" required={!editingId} value={catSection}
                    onChange={(event) => { setCatSection(event.target.value as MainSection | ''); setCatParentId(''); }}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm">
                    <option value="">{editingId ? 'Unassigned (legacy)' : 'Select main section'}</option>
                    {Object.entries(SECTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="cat-parent">Parent Category</Label>
                  <select id="cat-parent" value={catParentId} onChange={(event) => setCatParentId(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm">
                    <option value="">None — top-level category</option>
                    {parentOptions.map((category) => <option key={category.id} value={category.id}>{getCategoryPath(category, mappedCategories)}</option>)}
                    {catParentId && !parentOptions.some((category) => category.id === catParentId) &&
                      <option value={catParentId} disabled>Invalid existing parent — select a valid parent</option>}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input id="cat-published" type="checkbox" checked={catIsPublished} onChange={(event) => setCatIsPublished(event.target.checked)} />
                  <Label htmlFor="cat-published">Published</Label>
                </div>
                <p className="text-xs text-muted-foreground">Draft categories hide their entire branch from public listings. Existing product assignments are retained.</p>
              </>}

              {showCategoryServiceAssignments && (
                <div className="rounded-xl border border-gold/20 bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gold-deep">
                        Applicable Metal Services
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Choose one or more services, or keep N/A. Home Decor categories are not eligible.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-gold/10 px-2 py-1 text-[10px] font-semibold text-gold-deep">
                      {isNoServiceAssigned(catServiceIds)
                        ? 'N/A'
                        : formatServiceSelectionCount(catServiceIds.length)}
                    </span>
                  </div>

                  {catSection !== 'metal_services' && (
                    <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-400">
                      This category is outside the Metal division. Set Main Section to Metal to edit its service links.
                    </p>
                  )}

                  {serviceCategorySupported === null && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Checking service-category relationship schema…
                    </p>
                  )}

                  {serviceCategorySupported === false && (
                    <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-400">
                      Service-category assignments require the approved database migration. Category details can still be saved.
                    </p>
                  )}

                  {serviceCategorySupported === true && catSection === 'metal_services' && (
                    <div className="mt-3 space-y-2">
                      {!relationshipControlsReady && (
                        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                          Applicable Metal Services could not be loaded. Refresh and reopen this category before changing assignments.
                        </p>
                      )}

                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gold/30 bg-gold/5 p-3">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={isNoServiceAssigned(catServiceIds)}
                          disabled={!relationshipControlsReady}
                          onChange={(event) =>
                            setCatServiceIds(
                              toggleNoServiceAssigned(catServiceIds, event.target.checked)
                            )
                          }
                        />
                        <span className="text-xs font-medium">
                          N/A — No Service Assigned
                          <span className="mt-0.5 block font-normal text-muted-foreground">
                            Keep this checked to leave the category published in Metal Collections without a service link.
                          </span>
                        </span>
                      </label>

                      {services.length === 0 ? (
                        <p className="rounded-lg border border-border/60 p-2.5 text-xs text-muted-foreground">
                          No services are available yet. Create a service first.
                        </p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {services.map((serviceRow) => (
                            <label
                              key={serviceRow.id}
                              className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 bg-card/40 p-2.5"
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5"
                                checked={catServiceIds.includes(serviceRow.id)}
                                disabled={!relationshipControlsReady}
                                onChange={() =>
                                  setCatServiceIds((previous) =>
                                    toggleIdSelection(previous, serviceRow.id)
                                  )
                                }
                              />
                              <span className="min-w-0 text-xs">
                                <span className="block font-medium">{serviceRow.name}</span>
                                <span className="block truncate font-mono text-[10px] text-muted-foreground">
                                  {serviceRow.slug}
                                  {serviceRow.is_published === false ? ' · Draft' : ''}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {isNoServiceAssigned(catServiceIds)
                          ? 'N/A — No Service Assigned'
                          : formatServiceSelectionCount(catServiceIds.length)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label>Category Name *</Label>
                <Input
                  required
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!editingId) setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                  }}
                  placeholder="PU Brass Accents"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input
                  required
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="pu-brass-accents"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tagline</Label>
                <Input
                  value={catTagline}
                  onChange={(e) => setCatTagline(e.target.value)}
                  placeholder="Architectural metal finishes"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Short category summary"
                  className="mt-1 min-h-[70px]"
                />
              </div>
              <div>
                <Label>Category Image URL / Upload</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={catImage}
                    onChange={(e) => setCatImage(e.target.value)}
                    placeholder="https://..."
                  />
                  <label className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-medium hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) void handleFileUpload(file, setCatImage, 'category', 'category');
                      }}
                    />
                  </label>
                </div>
                {singleUpload?.target === 'category' && (
                  <div className="mt-2">
                    <ImageUploadStatusCard
                      item={singleUpload}
                      onCancel={cancelSingleUpload}
                      onRetry={retrySingleUpload}
                      onDismiss={dismissSingleUpload}
                    />
                  </div>
                )}
                {catImage && (
                  <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-xl border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={catImage} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Display Order</Label>
                  <Input type="number" value={catOrder} onChange={(e) => setCatOrder(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="catFeat"
                    checked={catIsFeatured}
                    onChange={(e) => setCatIsFeatured(e.target.checked)}
                    className="rounded border-border"
                  />
                  <Label htmlFor="catFeat">Featured</Label>
                </div>
              </div>
          </AdminFormPanel>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4">Categories ({categories.length})</h3>
            <AdminListToolbar
              search={catListSearch}
              onSearchChange={(value) => {
                setCatListSearch(value);
                setCatListPage(1);
              }}
              searchPlaceholder="Search category name, slug, tagline, ID…"
              resultCount={categoryListData.total}
              totalCount={categories.length}
              onClear={() => {
                setCatListSearch('');
                setCatListSection('all');
                setCatListStatus('all');
                setCatListAssignment('all');
                setCatListHierarchy('all');
                setCatListSort('order');
                setCatListPage(1);
              }}
              clearDisabled={
                !catListSearch &&
                catListSection === 'all' &&
                catListStatus === 'all' &&
                catListAssignment === 'all' &&
                catListHierarchy === 'all' &&
                catListSort === 'order'
              }
            >
              <AdminFilterSelect
                label="Division"
                value={catListSection}
                onChange={(value) => {
                  setCatListSection(value);
                  setCatListPage(1);
                }}
                options={[
                  { value: 'all', label: 'All divisions' },
                  { value: 'home_decor', label: 'Home Decor' },
                  { value: 'metal_services', label: 'Metal Services' },
                  { value: 'legacy', label: 'Unassigned / legacy' },
                ]}
              />
              {serviceCategorySupported === true && (
                <AdminFilterSelect
                  label="Service"
                  value={catListAssignment}
                  onChange={(value) => {
                    setCatListAssignment(value);
                    setCatListPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'All assignments' },
                    { value: 'assigned', label: 'Assigned to a service' },
                    { value: 'unassigned', label: 'N/A — no service assigned' },
                    ...services.map((service) => ({
                      value: `service:${service.id}`,
                      label: service.name,
                    })),
                  ]}
                />
              )}
              <AdminFilterSelect
                label="Hierarchy"
                value={catListHierarchy}
                onChange={(value) => {
                  setCatListHierarchy(value);
                  setCatListPage(1);
                }}
                options={[
                  { value: 'all', label: 'All levels' },
                  { value: 'top', label: 'Top level' },
                  { value: 'child', label: 'Subcategories' },
                ]}
              />
              <AdminFilterSelect
                label="Status"
                value={catListStatus}
                onChange={(value) => {
                  setCatListStatus(value);
                  setCatListPage(1);
                }}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                ]}
              />
              <AdminFilterSelect
                label="Sort"
                value={catListSort}
                onChange={(value) => {
                  setCatListSort(value);
                  setCatListPage(1);
                }}
                options={[
                  { value: 'order', label: 'Display order' },
                  { value: 'name', label: 'Name A–Z' },
                  { value: 'newest', label: 'Newest first' },
                ]}
              />
            </AdminListToolbar>
            {categoryListError && (
              <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                {categoryListError}
              </p>
            )}
            {categoryListLoading && categoryListData.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Loading categories…
              </p>
            ) : categoryListData.total === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {categories.length === 0
                  ? 'No categories in database.'
                  : 'No categories match these filters.'}
              </p>
            ) : (
              <div className="space-y-3">
                {pagedCategories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="flex items-center gap-3">
                      {c.image && (
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold">{c.name}</h4>
                          {c.is_featured && <span className="text-[10px] bg-gold/20 text-gold-deep px-2 py-0.5 rounded-full font-bold">Featured</span>}
                        </div>
                        <p className="text-xs font-mono text-muted-foreground">slug: {c.slug} • Order: {c.display_order || 0}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.main_section === 'home_decor' || c.main_section === 'metal_services' ? SECTION_LABELS[c.main_section as MainSection] : 'Unassigned (legacy)'}
                          {c.parent_id ? ` · Parent: ${categories.find((parent) => parent.id === c.parent_id)?.name || 'Invalid'}` : ' · Top level'}
                          {c.is_published === false ? ' · Draft' : ''}
                        </p>
                        {serviceCategorySupported === true &&
                          (c.main_section === 'metal_services' ||
                            relatedServiceCountForCategory(c.id) > 0) && (
                            <p className="text-xs text-muted-foreground">
                              {relatedServiceCountForCategory(c.id) === 0
                                ? 'N/A — No Service Assigned'
                                : `${relatedServiceCountForCategory(c.id)} service${relatedServiceCountForCategory(c.id) === 1 ? '' : 's'} assigned`}
                            </p>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          clearUploadState();
                          setEditingId(c.id);
                          setCatName(c.name);
                          setCatSlug(c.slug);
                          setCatTagline(c.tagline || '');
                          setCatDesc(c.description || '');
                          setCatImage(c.image || '');
                          setCatIsFeatured(c.is_featured || false);
                          setCatOrder(c.display_order?.toString() || '0');
                          setCatSection(c.main_section === 'home_decor' || c.main_section === 'metal_services' ? c.main_section : '');
                          setCatParentId(c.parent_id || '');
                          setCatIsPublished(c.is_published !== false);
                          const canReadAssignments =
                            serviceCategorySupported === true && serviceCategoryLinksLoaded;
                          const assignedServiceIds = canReadAssignments
                            ? normalizeIdList(
                                serviceCategoryLinks
                                  .filter((link) => link.category_id === c.id)
                                  .map((link) => link.service_id)
                              )
                            : [];
                          setCatServiceIds(assignedServiceIds);
                          setCatServiceBaseline(
                            canReadAssignments
                              ? assignedServiceIds
                              : serviceCategorySupported === false
                                ? []
                                : null
                          );
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete category?')) {
                            deleteCategoryAdmin(c.id).then(loadAllData);
                          }
                        }}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <AdminPagination
              page={safeCategoryListPage}
              pageCount={categoryListPageCount}
              total={categoryListData.total}
              pageSize={ADMIN_LIST_PAGE_SIZE}
              onPageChange={setCatListPage}
            />
          </div>
        </div>
      )}

      {/* PRODUCTS TAB (Complete 19-Field Coverage) */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AdminFormPanel
            title={editingId ? 'Edit Product' : 'Add Product'}
            icon={<Plus className="h-4 w-4 text-gold-deep" />}
            formProps={{ onSubmit: handleProductSubmit }}
            footer={
              <>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForms}
                    className="w-full sm:w-auto"
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full gold-button font-medium sm:w-auto sm:min-w-[10rem]"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    'Update Product'
                  ) : (
                    'Save Product'
                  )}
                </Button>
              </>
            }
          >
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gold-deep border-b border-border pb-1">1. Basic Information</p>
                <div>
                  <Label>Product Name *</Label>
                  <Input
                    required
                    value={prodName}
                    onChange={(e) => {
                      setProdName(e.target.value);
                      if (!editingId) setProdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                    }}
                    placeholder="Brass Vessel"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Slug *</Label>
                    <Input required value={prodSlug} onChange={(e) => setProdSlug(e.target.value)} placeholder="brass-vessel" />
                  </div>
                  <div>
                    <Label>SKU / Code</Label>
                    <Input value={prodSku} onChange={(e) => setProdSku(e.target.value)} placeholder="RTM-BRS-001" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="prod-section">Main Section</Label>
                  <select id="prod-section" value={prodSection}
                    onChange={(event) => { setProdSection(event.target.value as MainSection | ''); setProdCatId(''); }}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm">
                    <option value="">Unassigned / legacy categories</option>
                    {Object.entries(SECTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="prod-category">Category / Subcategory *</Label>
                    <select
                      id="prod-category"
                      required
                      value={prodCatId}
                      onChange={(e) => setProdCatId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background/50 p-2.5 text-sm"
                    >
                      <option value="">Select a category</option>
                      {productCategoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>{getCategoryPath(c, mappedCategories)}{c.isPublished === false ? ' (Draft)' : ''}</option>
                      ))}
                      {prodCatId && !productCategoryOptions.some((category) => category.id === prodCatId) &&
                        <option value={prodCatId} disabled>Invalid existing assignment — review required</option>}
                    </select>
                  </div>
                  <div>
                    <Label>Legacy Sub-Category Label</Label>
                    <Input value={prodSubCat} onChange={(e) => setProdSubCat(e.target.value)} placeholder="Vessels / Planters" />
                    <p className="mt-1 text-xs text-muted-foreground">Text only. Select a configured subcategory above for navigation.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gold-deep border-b border-border pb-1">2. Descriptions</p>
                <div>
                  <Label>Short Description</Label>
                  <Textarea value={prodShortDesc} onChange={(e) => setProdShortDesc(e.target.value)} placeholder="Brief product summary" className="min-h-[60px]" />
                </div>
                <div>
                  <Label>Full Description *</Label>
                  <Textarea value={prodFullDesc} onChange={(e) => setProdFullDesc(e.target.value)} placeholder="Detailed description of craftsmanship" className="min-h-[90px]" />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gold-deep border-b border-border pb-1">3. Pricing & Inventory</p>

                <div>
                  <Label>Stock Availability</Label>
                  <select
                    value={prodStockStatus}
                    onChange={(e) => setProdStockStatus(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 p-2.5 text-sm"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gold-deep border-b border-border pb-1">4. Specifications</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Material</Label>
                    <Input value={prodMaterial} onChange={(e) => setProdMaterial(e.target.value)} placeholder="PU Brass Coating" />
                  </div>
                  <div>
                    <Label>Color / Finish</Label>
                    <Input value={prodColorFinish} onChange={(e) => setProdColorFinish(e.target.value)} placeholder="Antique Gold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Size / Dimensions</Label>
                    <Input value={prodDimensions} onChange={(e) => setProdDimensions(e.target.value)} placeholder='12" x 8"' />
                  </div>
                  <div>
                    <Label>Weight</Label>
                    <Input value={prodWeight} onChange={(e) => setProdWeight(e.target.value)} placeholder="2.5 kg" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gold-deep border-b border-border pb-1">5. Features & Care</p>
                <div>
                  <Label>Product Features (1 per line)</Label>
                  <Textarea value={prodFeatures} onChange={(e) => setProdFeatures(e.target.value)} placeholder="Handmade&#10;Corrosion resistant&#10;Bespoke patina" className="min-h-[80px]" />
                </div>
                <div>
                  <Label>Care Instructions</Label>
                  <Textarea value={prodCareInstructions} onChange={(e) => setProdCareInstructions(e.target.value)} placeholder="Clean with a soft dry cloth." className="min-h-[60px]" />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gold-deep border-b border-border pb-1">6. Media & Storage Upload</p>
                <div>
                  <Label>Main Image URL / Upload</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={prodImage} onChange={(e) => setProdImage(e.target.value)} placeholder="https://..." />
                    <label className="cursor-pointer flex items-center gap-1 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-medium hover:bg-muted">
                      <Upload className="h-4 w-4" />
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (file) void handleFileUpload(file, setProdImage, 'product-main', 'product-main');
                        }}
                      />
                    </label>
                  </div>
                  {singleUpload?.target === 'product-main' && (
                    <div className="mt-2">
                      <ImageUploadStatusCard
                        item={singleUpload}
                        onCancel={cancelSingleUpload}
                        onRetry={retrySingleUpload}
                        onDismiss={dismissSingleUpload}
                      />
                    </div>
                  )}
                  {prodImage && (
                    <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-xl border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={prodImage} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gold-deep border-b border-border pb-1">6. Product Gallery</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Additional Images</Label>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                        {prodGalleryImages.map((img, idx) => (
                          <div key={img.id || idx} className="group relative aspect-square overflow-hidden rounded-xl border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveGalleryImage(idx, 'up')}
                                  disabled={idx === 0}
                                  aria-label="Move image up"
                                  className="rounded-md bg-background/80 p-1 text-foreground disabled:opacity-50"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveGalleryImage(idx, 'down')}
                                  disabled={idx === prodGalleryImages.length - 1}
                                  aria-label="Move image down"
                                  className="rounded-md bg-background/80 p-1 text-foreground disabled:opacity-50"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeGalleryImage(idx)}
                                aria-label="Remove image"
                                className="rounded-md bg-destructive/80 p-1 text-white"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setProdImage(img.imageUrl);
                                  setProdGalleryImages(prev => prev.map(pImg => ({
                                    ...pImg,
                                    isPrimary: pImg.imageUrl === img.imageUrl
                                  })));
                                }}
                                aria-label="Set as primary image"
                                className="rounded-md bg-gold/80 p-1 text-ink text-[10px] font-bold"
                              >
                                Set Primary
                              </button>
                            </div>
                            <div className="absolute bottom-0 w-full bg-background/60 px-1 py-0.5 text-[10px] text-center backdrop-blur-sm">
                              {idx + 1}
                            </div>
                          </div>
                        ))}
                      <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 transition-colors hover:bg-muted/50">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
                          className="hidden"
                          onChange={handleGalleryFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                  {galleryUploads.length > 0 && (
                    <ImageUploadStatusList
                      items={galleryUploads}
                      onCancel={cancelGalleryUpload}
                      onRetry={retryGalleryUpload}
                      onDismiss={dismissGalleryUpload}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gold-deep border-b border-border pb-1">7. Publishing & Sorting</p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Display Order</Label>
                    <Input type="number" value={prodOrder} onChange={(e) => setProdOrder(e.target.value)} />
                  </div>
                  <div>
                    <Label>Badge</Label>
                    <Input value={prodBadge} onChange={(e) => setProdBadge(e.target.value)} placeholder="New / Bestseller" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="pPub" checked={prodIsPublished} onChange={(e) => setProdIsPublished(e.target.checked)} />
                    <Label htmlFor="pPub">Published</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="pFeat" checked={prodIsFeatured} onChange={(e) => setProdIsFeatured(e.target.checked)} />
                    <Label htmlFor="pFeat">Featured</Label>
                  </div>
                </div>
              </div>

          </AdminFormPanel>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4">Products ({products.length})</h3>
            <AdminListToolbar
              search={prodListSearch}
              onSearchChange={(value) => {
                setProdListSearch(value);
                setProdListPage(1);
              }}
              searchPlaceholder="Search product name, ID, SKU, material, category…"
              resultCount={productListData.total}
              totalCount={products.length}
              onClear={() => {
                setProdListSearch('');
                setProdListStatus('all');
                setProdListSection('all');
                setProdListCategory('all');
                setProdListStock('all');
                setProdListSort('newest');
                setProdListPage(1);
              }}
              clearDisabled={
                !prodListSearch &&
                prodListStatus === 'all' &&
                prodListSection === 'all' &&
                prodListCategory === 'all' &&
                prodListStock === 'all' &&
                prodListSort === 'newest'
              }
            >
              <AdminFilterSelect
                label="Division"
                value={prodListSection}
                onChange={(value) => {
                  setProdListSection(value);
                  setProdListCategory('all');
                  setProdListPage(1);
                }}
                options={[
                  { value: 'all', label: 'All divisions' },
                  { value: 'home_decor', label: 'Home Decor' },
                  { value: 'metal_services', label: 'Metal Services' },
                  { value: 'legacy', label: 'Unassigned / legacy' },
                ]}
              />
              <AdminFilterSelect
                label="Category"
                value={prodListCategory}
                onChange={(value) => {
                  setProdListCategory(value);
                  setProdListPage(1);
                }}
                options={[
                  { value: 'all', label: 'All categories' },
                  ...productListCategoryOptions.map((category) => ({
                    value: String(category.id),
                    label: category.name,
                  })),
                ]}
              />
              <AdminFilterSelect
                label="Status"
                value={prodListStatus}
                onChange={(value) => {
                  setProdListStatus(value);
                  setProdListPage(1);
                }}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                ]}
              />
              <AdminFilterSelect
                label="Stock"
                value={prodListStock}
                onChange={(value) => {
                  setProdListStock(value);
                  setProdListPage(1);
                }}
                options={[
                  { value: 'all', label: 'All stock' },
                  { value: 'in_stock', label: 'In stock' },
                  { value: 'low_stock', label: 'Low stock' },
                  { value: 'out_of_stock', label: 'Out of stock' },
                ]}
              />
              <AdminFilterSelect
                label="Sort"
                value={prodListSort}
                onChange={(value) => {
                  setProdListSort(value);
                  setProdListPage(1);
                }}
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'order', label: 'Display order' },
                  { value: 'name', label: 'Name A–Z' },
                  { value: 'sku', label: 'SKU A–Z' },
                ]}
              />
            </AdminListToolbar>
            {productListError && (
              <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                {productListError}
              </p>
            )}
            {productListLoading && productListData.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Loading products…
              </p>
            ) : productListData.total === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {products.length === 0
                  ? 'No products in database.'
                  : 'No products match these filters.'}
              </p>
            ) : (
              <div className="space-y-3">
                {pagedProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="flex items-center gap-3">
                      {p.image && (
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold">{p.name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.is_published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {p.is_published ? 'Published' : 'Draft'}
                          </span>
                          {p.is_featured && <span className="text-[10px] bg-gold/20 text-gold-deep px-2 py-0.5 rounded-full font-bold">Featured</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          slug: {p.slug}{p.sku ? ` • SKU: ${p.sku}` : ''}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground/70">
                          ID: {p.id}
                        </p>
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                          Stock: {p.stock_status || 'in_stock'} • Material: {p.material || 'N/A'} • Order: {p.display_order || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          updateProductAdmin(p.id, { is_published: !p.is_published }).then(loadAllData);
                        }}
                      >
                        {p.is_published ? <EyeOff className="h-4 w-4 text-amber-400" /> : <Eye className="h-4 w-4 text-emerald-400" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          clearUploadState();
                          setEditingId(p.id);
                          setProdName(p.name);
                          setProdSlug(p.slug);
                          setProdSku(p.sku || '');
                          setProdCatId(p.category_id);
                          setProdSection(mappedCategories.find((category) => category.id === p.category_id)?.mainSection || '');
                          setProdSubCat(p.sub_category || '');
                          setProdImage(p.image || '');
                          setProdBadge(p.badge || '');
                          setProdShortDesc(p.short_description || '');
                          setProdFullDesc(p.description || '');
                          setProdMaterial(p.material || '');
                          setProdColorFinish(p.color_finish || '');
                          setProdDimensions(p.dimensions || '');
                          setProdWeight(p.weight || '');
                          setProdStockStatus(p.stock_status || 'in_stock');
                          setProdFeatures(p.features ? p.features.join('\n') : '');
                          setProdCareInstructions(p.care_instructions || '');
                          setProdIsPublished(p.is_published);
                          setProdIsFeatured(p.is_featured || false);
                          setProdOrder(p.display_order?.toString() || '0');
                          loadProductGallery(p.id, p.product_images);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete product?')) {
                            deleteProductAdmin(p.id).then(loadAllData);
                          }
                        }}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <AdminPagination
              page={safeProductListPage}
              pageCount={productListPageCount}
              total={productListData.total}
              pageSize={ADMIN_LIST_PAGE_SIZE}
              onPageChange={setProdListPage}
            />
          </div>
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AdminFormPanel
            title={editingId ? 'Edit Service' : 'Add Service'}
            icon={<Plus className="h-4 w-4 text-gold-deep" />}
            formProps={{ onSubmit: handleServiceSubmit }}
            footer={
              <>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForms}
                    className="w-full sm:w-auto"
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full gold-button font-medium sm:w-auto sm:min-w-[10rem]"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    'Update Service'
                  ) : (
                    'Save Service'
                  )}
                </Button>
              </>
            }
          >
              <div>
                <Label>Service Name *</Label>
                <Input required value={svcName} onChange={(e) => setSvcName(e.target.value)} placeholder="PU Brass Coating" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Slug *</Label>
                  <Input required value={svcSlug} onChange={(e) => setSvcSlug(e.target.value)} placeholder="pu-brass-coating" />
                </div>
                <div>
                  <Label>Short Name</Label>
                  <Input value={svcShortName} onChange={(e) => setSvcShortName(e.target.value)} placeholder="Brass Coating" />
                </div>
              </div>
              <div>
                <Label>Short Description *</Label>
                <Textarea required value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} placeholder="High durability brass finish" className="min-h-[60px]" />
              </div>
              <div>
                <Label>Full / Long Description</Label>
                <Textarea value={svcLongDesc} onChange={(e) => setSvcLongDesc(e.target.value)} placeholder="Complete details of coating process" className="min-h-[90px]" />
              </div>
              <div>
                <Label>Features (1 per line)</Label>
                <Textarea value={svcFeatures} onChange={(e) => setSvcFeatures(e.target.value)} placeholder="High gloss finish&#10;Corrosion resistant" className="min-h-[70px]" />
              </div>
              <div>
                <Label>Applications (1 per line)</Label>
                <Textarea value={svcApplications} onChange={(e) => setSvcApplications(e.target.value)} placeholder="Architectural facades&#10;Interior decor" className="min-h-[70px]" />
              </div>
              <div>
                <Label>Process Steps (JSON array — leave blank to preserve existing)</Label>
                <Textarea
                  value={svcProcessSteps}
                  onChange={(e) => setSvcProcessSteps(e.target.value)}
                  placeholder={'[\n  {"title": "Step 1", "description": "…"}\n]'}
                  className="min-h-[100px] font-mono text-xs"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Must be a valid JSON array or left empty. Leave blank when editing to preserve existing process steps unchanged.
                </p>
              </div>
              <div>
                <Label>Image URL / Upload</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={svcImage} onChange={(e) => setSvcImage(e.target.value)} placeholder="https://..." />
                  <label className="cursor-pointer flex items-center gap-1 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-medium hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) void handleFileUpload(file, setSvcImage, 'service', 'service');
                      }}
                    />
                  </label>
                </div>
                {singleUpload?.target === 'service' && (
                  <div className="mt-2">
                    <ImageUploadStatusCard
                      item={singleUpload}
                      onCancel={cancelSingleUpload}
                      onRetry={retrySingleUpload}
                      onDismiss={dismissSingleUpload}
                    />
                  </div>
                )}
                {svcImage && (
                  <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-xl border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={svcImage} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gold/20 bg-background/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gold-deep">
                      Related Metal Categories
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Link this service to any number of Metal categories. Unassigned categories stay in the main Metal Collections directory.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gold/10 px-2 py-1 text-[10px] font-semibold text-gold-deep">
                    {isNoServiceAssigned(svcCategoryIds)
                      ? 'None'
                      : formatCategorySelectionCount(svcCategoryIds.length)}
                  </span>
                </div>

                {serviceCategorySupported === null && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Checking service-category relationship schema…
                  </p>
                )}

                {serviceCategorySupported === false && (
                  <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-400">
                    Related category assignments require the approved database migration. Service details can still be saved.
                  </p>
                )}

                {serviceCategorySupported === true && (
                  <div className="mt-3 space-y-3">
                    {!relationshipControlsReady && (
                      <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                        Related categories could not be loaded{serviceCategoryLinksError ? `: ${serviceCategoryLinksError}` : ''}. Refresh and reopen this service before changing assignments.
                      </p>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={svcCategorySearch}
                        onChange={(event) => setSvcCategorySearch(event.target.value)}
                        placeholder="Search Metal categories…"
                        className="h-9 text-xs"
                        aria-label="Search Metal categories"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSvcCategoryIds([])}
                        disabled={svcCategoryIds.length === 0 || !relationshipControlsReady}
                        className="shrink-0 rounded-lg text-xs"
                      >
                        Clear selection
                      </Button>
                    </div>

                    {metalCategoryOptions.length === 0 ? (
                      <p className="rounded-lg border border-border/60 p-2.5 text-xs text-muted-foreground">
                        No Metal categories are available. Create a Metal category first.
                      </p>
                    ) : filteredMetalCategoryOptions.length === 0 ? (
                      <p className="rounded-lg border border-border/60 p-2.5 text-xs text-muted-foreground">
                        No categories match “{svcCategorySearch}”.
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {filteredMetalCategoryOptions.map((option) => (
                          <label
                            key={option.id}
                            className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 bg-card/40 p-2.5"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={svcCategoryIds.includes(option.id)}
                              disabled={!relationshipControlsReady}
                              onChange={() =>
                                setSvcCategoryIds((previous) =>
                                  toggleIdSelection(previous, option.id)
                                )
                              }
                            />
                            <span className="min-w-0 text-xs">
                              <span className="block font-medium">{option.name}</span>
                              <span className="block truncate text-[10px] text-muted-foreground">
                                {option.path}
                                {option.isPublished ? '' : ' · Draft'}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {isNoServiceAssigned(svcCategoryIds)
                        ? 'No Categories Assigned'
                        : formatCategorySelectionCount(svcCategoryIds.length)}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Display Order</Label>
                  <Input type="number" value={svcOrder} onChange={(e) => setSvcOrder(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="sPub" checked={svcIsPublished} onChange={(e) => setSvcIsPublished(e.target.checked)} />
                  <Label htmlFor="sPub">Published</Label>
                </div>
              </div>
          </AdminFormPanel>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4">Services ({services.length})</h3>
            <AdminListToolbar
              search={svcListSearch}
              onSearchChange={(value) => {
                setSvcListSearch(value);
                setSvcListPage(1);
              }}
              searchPlaceholder="Search service name, slug, description…"
              resultCount={filteredServices.length}
              totalCount={services.length}
              onClear={() => {
                setSvcListSearch('');
                setSvcListStatus('all');
                setSvcListCategory('all');
                setSvcListSort('order');
                setSvcListPage(1);
              }}
              clearDisabled={
                !svcListSearch &&
                svcListStatus === 'all' &&
                svcListCategory === 'all' &&
                svcListSort === 'order'
              }
            >
              {serviceCategorySupported === true && (
                <AdminFilterSelect
                  label="Category"
                  value={svcListCategory}
                  onChange={(value) => {
                    setSvcListCategory(value);
                    setSvcListPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'All categories' },
                    { value: 'unassigned', label: 'No categories assigned' },
                  ...metalCategoryOptions.map((category) => ({
                    value: String(category.id),
                    label: category.name,
                  })),
                  ]}
                />
              )}
              <AdminFilterSelect
                label="Status"
                value={svcListStatus}
                onChange={(value) => {
                  setSvcListStatus(value);
                  setSvcListPage(1);
                }}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                ]}
              />
              <AdminFilterSelect
                label="Sort"
                value={svcListSort}
                onChange={(value) => {
                  setSvcListSort(value);
                  setSvcListPage(1);
                }}
                options={[
                  { value: 'order', label: 'Display order' },
                  { value: 'name', label: 'Name A–Z' },
                ]}
              />
            </AdminListToolbar>
            {filteredServices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {services.length === 0
                  ? 'No services in database.'
                  : 'No services match these filters.'}
              </p>
            ) : (
              <div className="space-y-3">
                {pagedServices.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center gap-3">
                    {s.image && (
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{s.name}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.is_published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {s.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">slug: {s.slug} • Short name: {s.short_name || s.name}</p>
                      {serviceCategorySupported === true && (
                        <p className="text-xs text-muted-foreground">
                          {relatedCategoryCountForService(s.id) === 0
                            ? 'No Categories Assigned'
                            : `${relatedCategoryCountForService(s.id)} related categor${relatedCategoryCountForService(s.id) === 1 ? 'y' : 'ies'}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearUploadState();
                        setEditingId(s.id);
                        setSvcName(s.name);
                        setSvcSlug(s.slug);
                        setSvcShortName(s.short_name || '');
                        setSvcDesc(s.description || '');
                        setSvcLongDesc(s.long_description || '');
                        setSvcImage(s.image || '');
                        setSvcFeatures(s.features ? s.features.join('\n') : '');
                        setSvcApplications(s.applications ? s.applications.join('\n') : '');
                        // Lossless: serialise the raw DB array as JSON so structured objects are fully preserved.
                        // Editing the textarea is intentionally explicit; leave blank to preserve existing steps unchanged.
                        setSvcProcessSteps(
                          s.process_steps && Array.isArray(s.process_steps) && s.process_steps.length > 0
                            ? JSON.stringify(s.process_steps, null, 2)
                            : ''
                        );
                        setSvcOrder(s.display_order?.toString() || '0');
                        setSvcIsPublished(s.is_published);
                        const canReadAssignments =
                          serviceCategorySupported === true && serviceCategoryLinksLoaded;
                        const assignedCategoryIds = canReadAssignments
                          ? normalizeIdList(
                              serviceCategoryLinks
                                .filter((link) => link.service_id === s.id)
                                .map((link) => link.category_id)
                            )
                          : [];
                        setSvcCategoryIds(assignedCategoryIds);
                        setSvcCategoryBaseline(
                          canReadAssignments
                            ? assignedCategoryIds
                            : serviceCategorySupported === false
                              ? []
                              : null
                        );
                        setSvcCategorySearch('');
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete service?')) deleteServiceAdmin(s.id).then(loadAllData);
                      }}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              </div>
            )}
            <AdminPagination
              page={safeServiceListPage}
              pageCount={serviceListPageCount}
              total={filteredServices.length}
              pageSize={ADMIN_LIST_PAGE_SIZE}
              onPageChange={setSvcListPage}
            />
          </div>
        </div>
      )}

      {/* TESTIMONIALS TAB */}
      {activeTab === 'testimonials' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AdminFormPanel
            title={editingId ? 'Edit Testimonial' : 'Add Testimonial'}
            icon={<Plus className="h-4 w-4 text-gold-deep" />}
            formProps={{ onSubmit: handleTestimonialSubmit }}
            footer={
              <>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForms}
                    className="w-full sm:w-auto"
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full gold-button font-medium sm:w-auto sm:min-w-[10rem]"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    'Update Testimonial'
                  ) : (
                    'Save Testimonial'
                  )}
                </Button>
              </>
            }
          >
              <div>
                <Label>Client Name *</Label>
                <Input required value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="Rajesh Sharma" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Designation / Role</Label>
                  <Input value={testRole} onChange={(e) => setTestRole(e.target.value)} placeholder="Lead Architect" />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input value={testCompany} onChange={(e) => setTestCompany(e.target.value)} placeholder="Architectural Studio" />
                </div>
              </div>
              <div>
                <Label>Rating (1 to 5 Stars) *</Label>
                <select
                  value={testRating}
                  onChange={(e) => setTestRating(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 p-2.5 text-sm"
                >
                  <option value="5">★★★★★ (5 Stars)</option>
                  <option value="4">★★★★☆ (4 Stars)</option>
                  <option value="3">★★★☆☆ (3 Stars)</option>
                  <option value="2">★★☆☆☆ (2 Stars)</option>
                  <option value="1">★☆☆☆☆ (1 Star)</option>
                </select>
              </div>
              <div>
                <Label>Testimonial / Content *</Label>
                <Textarea required value={testContent} onChange={(e) => setTestContent(e.target.value)} placeholder="Outstanding craftsmanship." className="min-h-[90px]" />
              </div>
              <div>
                <Label>Customer Photo / Upload</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={testAvatar} onChange={(e) => setTestAvatar(e.target.value)} placeholder="https://..." />
                  <label className="cursor-pointer flex items-center gap-1 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-medium hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) void handleFileUpload(file, setTestAvatar, 'testimonial', 'testimonial');
                      }}
                    />
                  </label>
                </div>
                {singleUpload?.target === 'testimonial' && (
                  <div className="mt-2">
                    <ImageUploadStatusCard
                      item={singleUpload}
                      onCancel={cancelSingleUpload}
                      onRetry={retrySingleUpload}
                      onDismiss={dismissSingleUpload}
                    />
                  </div>
                )}
                {testAvatar && (
                  <div className="mt-2 relative h-16 w-16 overflow-hidden rounded-full border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={testAvatar} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Display Order</Label>
                  <Input type="number" value={testOrder} onChange={(e) => setTestOrder(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="tPub" checked={testIsPublished} onChange={(e) => setTestIsPublished(e.target.checked)} />
                  <Label htmlFor="tPub">Published</Label>
                </div>
              </div>
          </AdminFormPanel>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4">Testimonials ({testimonials.length})</h3>
            <AdminListToolbar
              search={testListSearch}
              onSearchChange={(value) => {
                setTestListSearch(value);
                setTestListPage(1);
              }}
              searchPlaceholder="Search client, company, role, content…"
              resultCount={filteredTestimonials.length}
              totalCount={testimonials.length}
              onClear={() => {
                setTestListSearch('');
                setTestListStatus('all');
                setTestListSort('order');
                setTestListPage(1);
              }}
              clearDisabled={
                !testListSearch && testListStatus === 'all' && testListSort === 'order'
              }
            >
              <AdminFilterSelect
                label="Status"
                value={testListStatus}
                onChange={(value) => {
                  setTestListStatus(value);
                  setTestListPage(1);
                }}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                ]}
              />
              <AdminFilterSelect
                label="Sort"
                value={testListSort}
                onChange={(value) => {
                  setTestListSort(value);
                  setTestListPage(1);
                }}
                options={[
                  { value: 'order', label: 'Display order' },
                  { value: 'rating', label: 'Highest rating' },
                  { value: 'name', label: 'Name A–Z' },
                ]}
              />
            </AdminListToolbar>
            {filteredTestimonials.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {testimonials.length === 0
                  ? 'No testimonials in database.'
                  : 'No testimonials match these filters.'}
              </p>
            ) : (
              <div className="space-y-3">
                {pagedTestimonials.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center gap-3">
                    {t.avatar && (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{t.name}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.is_published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {t.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{t.role ? `${t.role} • ` : ''}{t.company || 'Private'} • Rating: {t.rating}/5 Stars</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearUploadState();
                        setEditingId(t.id);
                        setTestName(t.name);
                        setTestCompany(t.company || '');
                        setTestRole(t.role || '');
                        setTestContent(t.content || '');
                        setTestRating(t.rating?.toString() || '5');
                        setTestAvatar(t.avatar || '');
                        setTestOrder(t.display_order?.toString() || '0');
                        setTestIsPublished(t.is_published);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete testimonial?')) deleteTestimonialAdmin(t.id).then(loadAllData);
                      }}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              </div>
            )}
            <AdminPagination
              page={safeTestimonialListPage}
              pageCount={testimonialListPageCount}
              total={filteredTestimonials.length}
              pageSize={ADMIN_LIST_PAGE_SIZE}
              onPageChange={setTestListPage}
            />
          </div>
        </div>
      )}

      {/* METAL FINISHES TAB */}
      {activeTab === 'metal-finishes' && (
        <MetalFinishesManagement onTotalChange={handleMetalFinishCountChange} />
      )}

      {/* BEFORE & AFTER TAB */}
      {activeTab === 'before-after' && (
        <BeforeAfterManagement
          categories={categories}
          products={products}
          services={services}
          onTotalChange={handleBeforeAfterCountChange}
        />
      )}

      {/* FAQS TAB */}
      {activeTab === 'faqs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AdminFormPanel
            title={editingId ? 'Edit FAQ' : 'Add FAQ'}
            icon={<Plus className="h-4 w-4 text-gold-deep" />}
            formProps={{ onSubmit: handleFaqSubmit }}
            footer={
              <>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForms}
                    className="w-full sm:w-auto"
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gold-button font-medium sm:w-auto sm:min-w-[10rem]"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    'Update FAQ'
                  ) : (
                    'Save FAQ'
                  )}
                </Button>
              </>
            }
          >
              <div>
                <Label>Question *</Label>
                <Input required value={faqQ} onChange={(e) => setFaqQ(e.target.value)} placeholder="What is PU coating?" />
              </div>
              <div>
                <Label>Answer *</Label>
                <Textarea required value={faqA} onChange={(e) => setFaqA(e.target.value)} placeholder="Provide a clear answer…" className="min-h-[90px]" />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={faqCategory} onChange={(e) => setFaqCategory(e.target.value)} placeholder="General / Services / Pricing" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Display Order</Label>
                  <Input type="number" value={faqOrder} onChange={(e) => setFaqOrder(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="fPub" checked={faqIsPublished} onChange={(e) => setFaqIsPublished(e.target.checked)} />
                  <Label htmlFor="fPub">Published</Label>
                </div>
              </div>
          </AdminFormPanel>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4">FAQs ({faqs.length})</h3>
            <AdminListToolbar
              search={faqListSearch}
              onSearchChange={(value) => {
                setFaqListSearch(value);
                setFaqListPage(1);
              }}
              searchPlaceholder="Search question, answer, category…"
              resultCount={filteredFaqs.length}
              totalCount={faqs.length}
              onClear={() => {
                setFaqListSearch('');
                setFaqListCategory('all');
                setFaqListStatus('all');
                setFaqListSort('order');
                setFaqListPage(1);
              }}
              clearDisabled={
                !faqListSearch &&
                faqListCategory === 'all' &&
                faqListStatus === 'all' &&
                faqListSort === 'order'
              }
            >
              <AdminFilterSelect
                label="Category"
                value={faqListCategory}
                onChange={(value) => {
                  setFaqListCategory(value);
                  setFaqListPage(1);
                }}
                options={[
                  { value: 'all', label: 'All categories' },
                  ...faqCategories.map((category) => ({
                    value: category,
                    label: category,
                  })),
                ]}
              />
              <AdminFilterSelect
                label="Status"
                value={faqListStatus}
                onChange={(value) => {
                  setFaqListStatus(value);
                  setFaqListPage(1);
                }}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                ]}
              />
              <AdminFilterSelect
                label="Sort"
                value={faqListSort}
                onChange={(value) => {
                  setFaqListSort(value);
                  setFaqListPage(1);
                }}
                options={[
                  { value: 'order', label: 'Display order' },
                  { value: 'question', label: 'Question A–Z' },
                ]}
              />
            </AdminListToolbar>
            {filteredFaqs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {faqs.length === 0
                  ? 'No FAQs in database.'
                  : 'No FAQs match these filters.'}
              </p>
            ) : (
              <div className="space-y-3">
                {pagedFaqs.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{f.question}</h4>
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{f.category || 'General'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-md mt-1">{f.answer}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(f.id);
                        setFaqQ(f.question);
                        setFaqA(f.answer);
                        setFaqCategory(f.category || 'General');
                        setFaqOrder(f.display_order?.toString() || '0');
                        setFaqIsPublished(f.is_published);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete FAQ?')) deleteFaqAdmin(f.id).then(loadAllData);
                      }}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              </div>
            )}
            <AdminPagination
              page={safeFaqListPage}
              pageCount={faqListPageCount}
              total={filteredFaqs.length}
              pageSize={ADMIN_LIST_PAGE_SIZE}
              onPageChange={setFaqListPage}
            />
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AdminFormPanel
            title="Save Site Setting"
            icon={<Plus className="h-4 w-4 text-gold-deep" />}
            formProps={{ onSubmit: handleSettingSubmit }}
            footer={
              <Button
                type="submit"
                disabled={loading}
                className="w-full gold-button font-medium sm:w-auto sm:min-w-[10rem]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save Setting'
                )}
              </Button>
            }
          >
              <div>
                <Label>Setting Key *</Label>
                <Input required value={setKey} onChange={(e) => setSetKey(e.target.value)} placeholder="brandName" />
              </div>
              <div>
                <Label>Setting Value (JSON or Text) *</Label>
                <Textarea required value={setValue} onChange={(e) => setSetValue(e.target.value)} placeholder='"RT METALS"' className="min-h-[100px]" />
              </div>
          </AdminFormPanel>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4">Site Settings ({settings.length})</h3>
            <AdminListToolbar
              search={settingsSearch}
              onSearchChange={(value) => {
                setSettingsSearch(value);
                setSettingsPage(1);
              }}
              searchPlaceholder="Search setting key or value…"
              resultCount={filteredSettings.length}
              totalCount={settings.length}
              onClear={() => {
                setSettingsSearch('');
                setSettingsPage(1);
              }}
              clearDisabled={!settingsSearch}
            />
            {filteredSettings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {settings.length === 0
                  ? 'No site settings in database.'
                  : 'No settings match this search.'}
              </p>
            ) : (
              <div className="space-y-3">
                {pagedSettings.map((s) => (
                <div key={s.id || s.key} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4">
                  <div>
                    <h4 className="text-sm font-semibold">{s.key}</h4>
                    <p className="text-xs font-mono text-muted-foreground">{JSON.stringify(s.value)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete setting key '${s.key}'?`)) {
                        deleteSiteSettingAdmin(s.key).then(loadAllData);
                      }
                    }}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              </div>
            )}
            <AdminPagination
              page={safeSettingsListPage}
              pageCount={settingsListPageCount}
              total={filteredSettings.length}
              pageSize={ADMIN_LIST_PAGE_SIZE}
              onPageChange={setSettingsPage}
            />
          </div>
        </div>
      )}

      {/* INQUIRIES / LEADS TAB */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-xl">
            <AdminListToolbar
              search={inquirySearch}
              onSearchChange={(value) => {
                setInquirySearch(value);
                setInquiryPage(1);
              }}
              searchPlaceholder="Search name, email, phone, message, admin notes…"
              resultCount={filteredInquiries.length}
              totalCount={inquiries.length}
              onClear={() => {
                setInquirySearch('');
                setInquiryDivisionFilter('all');
                setInquiryStatusFilter('all');
                setInquirySort('newest');
                setInquiryPage(1);
              }}
              clearDisabled={
                !inquirySearch &&
                inquiryDivisionFilter === 'all' &&
                inquiryStatusFilter === 'all' &&
                inquirySort === 'newest'
              }
            >
              <AdminFilterSelect
                label="Division"
                value={inquiryDivisionFilter}
                onChange={(value) => {
                  setInquiryDivisionFilter(value);
                  setInquiryPage(1);
                }}
                options={[
                  { value: 'all', label: 'All divisions' },
                  { value: 'home_decor', label: 'Home Decor & Lifestyle' },
                  { value: 'metal_coating', label: 'Metal Coating Services' },
                ]}
              />
              <AdminFilterSelect
                label="Status"
                value={inquiryStatusFilter}
                onChange={(value) => {
                  setInquiryStatusFilter(value);
                  setInquiryPage(1);
                }}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'new', label: 'New' },
                  { value: 'contacted', label: 'Contacted' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'converted', label: 'Converted' },
                  { value: 'closed', label: 'Closed' },
                ]}
              />
              <AdminFilterSelect
                label="Sort"
                value={inquirySort}
                onChange={(value) => {
                  setInquirySort(value);
                  setInquiryPage(1);
                }}
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                  { value: 'status', label: 'Status' },
                  { value: 'name', label: 'Name A–Z' },
                ]}
              />
            </AdminListToolbar>
          </div>

          {/* Inquiries List */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Inbox className="h-4 w-4 text-gold-deep" />
              Customer Inquiry Leads ({inquiries.length})
            </h3>

            {filteredInquiries.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {inquiries.length === 0
                  ? 'No customer inquiries in database yet.'
                  : 'No inquiries match these filters.'}
              </div>
            ) : (
              <div className="space-y-4">
                {pagedInquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="rounded-2xl border border-border/80 bg-background/50 p-5 space-y-4 transition-all hover:border-border"
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/40 pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-semibold">{inq.name}</h4>
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${inq.status === 'new'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : inq.status === 'contacted'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : inq.status === 'in_progress'
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : inq.status === 'converted'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                                }`}
                            >
                              {inq.status.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] bg-gold/15 text-gold-deep border border-gold/30 px-2 py-0.5 rounded-full font-medium">
                              {inq.division === 'metal_coating' ? 'Metal Coating' : 'Home Decor'}
                            </span>
                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground capitalize">
                              {inq.inquiryType} Inquiry
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>Email: <a href={`mailto:${inq.email}`} className="text-foreground hover:underline">{inq.email}</a></span>
                            {inq.phone && <span>Phone: <a href={`tel:${inq.phone}`} className="text-foreground hover:underline">{inq.phone}</a></span>}
                            <span>Date: {new Date(inq.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete inquiry lead from ${inq.name}?`)) {
                              deleteInquiryAdmin(inq.id)
                                .then(() => {
                                  setMessage({ type: 'success', text: 'Inquiry deleted successfully.' });
                                  loadAllData();
                                })
                                .catch((err) => setMessage({ type: 'error', text: err.message || 'Delete failed.' }));
                            }
                          }}
                          className="text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Lead
                        </Button>
                      </div>

                      {/* Snapshots info if present */}
                      {(inq.productNameSnapshot || inq.serviceNameSnapshot) && (
                        <div className="rounded-xl border border-gold/20 bg-gold/5 p-3 text-xs text-foreground/90 flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 text-gold-deep shrink-0" />
                          <span>
                            <strong>Referenced Context:</strong>{' '}
                            {inq.productNameSnapshot ? `Product — "${inq.productNameSnapshot}"` : `Service — "${inq.serviceNameSnapshot}"`}
                          </span>
                        </div>
                      )}

                      {/* Customer Message Body */}
                      <div className="rounded-xl bg-muted/30 p-4 border border-border/40">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Customer Message:</p>
                        <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">{inq.message}</p>
                      </div>

                      {/* Status & Admin Notes Management */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                        <div>
                          <Label className="text-xs font-medium mb-1.5 block">Update Status</Label>
                          <select
                            value={inq.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as InquiryStatus;
                              updateInquiryStatusAdmin(inq.id, { status: newStatus })
                                .then(() => {
                                  setMessage({ type: 'success', text: `Inquiry status updated to "${newStatus.replace('_', ' ')}"` });
                                  loadAllData();
                                })
                                .catch((err) => setMessage({ type: 'error', text: err.message || 'Status update failed.' }));
                            }}
                            className="w-full rounded-xl border border-border bg-background p-2 text-xs"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="in_progress">In Progress</option>
                            <option value="converted">Converted</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <Label className="text-xs font-medium">Internal Admin Notes</Label>
                            {editingNotesId === inq.id ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    updateInquiryStatusAdmin(inq.id, { admin_notes: currentNotesText })
                                      .then(() => {
                                        setMessage({ type: 'success', text: 'Admin notes saved!' });
                                        setEditingNotesId(null);
                                        loadAllData();
                                      })
                                      .catch((err) => setMessage({ type: 'error', text: err.message || 'Failed to save notes.' }));
                                  }}
                                  className="h-6 text-[10px] text-emerald-400 hover:bg-emerald-500/10 px-2"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingNotesId(null)}
                                  className="h-6 text-[10px] text-muted-foreground px-2"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingNotesId(inq.id);
                                  setCurrentNotesText(inq.adminNotes || '');
                                }}
                                className="h-6 text-[10px] text-gold-deep hover:bg-gold/10 px-2"
                              >
                                {inq.adminNotes ? 'Edit Notes' : 'Add Notes'}
                              </Button>
                            )}
                          </div>

                          {editingNotesId === inq.id ? (
                            <Textarea
                              value={currentNotesText}
                              onChange={(e) => setCurrentNotesText(e.target.value)}
                              placeholder="Write internal notes about client conversation..."
                              className="text-xs min-h-[60px]"
                            />
                          ) : (
                            <p className="text-xs text-muted-foreground italic bg-background/40 p-2.5 rounded-xl border border-border/40 min-h-[40px]">
                              {inq.adminNotes || 'No internal notes added yet.'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
            <AdminPagination
              page={safeInquiryListPage}
              pageCount={inquiryListPageCount}
              total={filteredInquiries.length}
              pageSize={ADMIN_LIST_PAGE_SIZE}
              onPageChange={setInquiryPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
