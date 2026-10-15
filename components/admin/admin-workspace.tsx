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
  Star,
  Layers,
  FileText,
  DollarSign,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';
import {
  uploadCatalogImage,
  getCategoriesAdmin,
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,
  getProductsAdmin,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  addProductGalleryImage,
  deleteProductGalleryImage,
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
import type { InquiryStatus } from '@/lib/types';
import { Inbox } from 'lucide-react';

export function AdminWorkspace() {
  const [activeTab, setActiveTab] = React.useState<
    'categories' | 'products' | 'services' | 'testimonials' | 'faqs' | 'settings' | 'inquiries'
  >('categories');

  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // ==================================================
  // PRODUCTS STATE (19 Complete Fields)
  // ==================================================
  const [products, setProducts] = React.useState<any[]>([]);
  const [prodName, setProdName] = React.useState('');
  const [prodSlug, setProdSlug] = React.useState('');
  const [prodSku, setProdSku] = React.useState('');
  const [prodCatId, setProdCatId] = React.useState('');
  const [prodSubCat, setProdSubCat] = React.useState('');
  const [prodPrice, setProdPrice] = React.useState('');
  const [prodOrigPrice, setProdOrigPrice] = React.useState('');
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
  const [prodIsPublished, setProdIsPublished] = React.useState(true);
  const [prodIsFeatured, setProdIsFeatured] = React.useState(false);
  const [prodOrder, setProdOrder] = React.useState('0');

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
  const [svcOrder, setSvcOrder] = React.useState('0');
  const [svcIsPublished, setSvcIsPublished] = React.useState(true);

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

  // ==================================================
  // INQUIRIES / LEADS STATE
  // ==================================================
  const [inquiries, setInquiries] = React.useState<any[]>([]);
  const [inquiryStatusFilter, setInquiryStatusFilter] = React.useState<string>('all');
  const [inquiryDivisionFilter, setInquiryDivisionFilter] = React.useState<string>('all');
  const [editingNotesId, setEditingNotesId] = React.useState<string | null>(null);
  const [currentNotesText, setCurrentNotesText] = React.useState<string>('');

  const loadAllData = React.useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [catList, prodList, svcList, testList, faqList, setList, inqList] = await Promise.all([
        getCategoriesAdmin().catch(() => []),
        getProductsAdmin().catch(() => []),
        getServicesAdmin().catch(() => []),
        getTestimonialsAdmin().catch(() => []),
        getFaqsAdmin().catch(() => []),
        getSiteSettingsAdmin().catch(() => []),
        getInquiriesAdmin().catch(() => []),
      ]);

      setCategories(catList);
      setProducts(prodList);
      setServices(svcList);
      setTestimonials(testList);
      setFaqs(faqList);
      setSettings(setList);
      setInquiries(inqList);

      if (catList.length > 0 && !prodCatId) {
        setProdCatId(catList[0].id);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load catalog data' });
    } finally {
      setLoading(false);
    }
  }, [prodCatId]);

  React.useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Image File Uploader Helper
  const handleFileUpload = async (file: File, targetSetter: (url: string) => void) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image file size exceeds 5MB limit.' });
      return;
    }
    setUploading(true);
    try {
      const publicUrl = await uploadCatalogImage(file);
      targetSetter(publicUrl);
      setMessage({ type: 'success', text: 'Image uploaded to Supabase Storage!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload image.' });
    } finally {
      setUploading(false);
    }
  };

  // Reset Forms
  const resetForms = () => {
    setEditingId(null);
    setCatName(''); setCatSlug(''); setCatTagline(''); setCatDesc(''); setCatImage(''); setCatIsFeatured(false); setCatOrder('0');
    setProdName(''); setProdSlug(''); setProdSku(''); setProdSubCat(''); setProdPrice(''); setProdOrigPrice(''); setProdImage(''); setProdBadge(''); setProdShortDesc(''); setProdFullDesc(''); setProdMaterial(''); setProdColorFinish(''); setProdDimensions(''); setProdWeight(''); setProdStockStatus('in_stock'); setProdFeatures(''); setProdCareInstructions(''); setProdIsPublished(true); setProdIsFeatured(false); setProdOrder('0');
    setSvcName(''); setSvcSlug(''); setSvcShortName(''); setSvcDesc(''); setSvcLongDesc(''); setSvcImage(''); setSvcFeatures(''); setSvcApplications(''); setSvcOrder('0'); setSvcIsPublished(true);
    setTestName(''); setTestCompany(''); setTestRole(''); setTestContent(''); setTestRating('5'); setTestAvatar(''); setTestOrder('0'); setTestIsPublished(true);
    setFaqQ(''); setFaqA(''); setFaqCategory('General'); setFaqOrder('0'); setFaqIsPublished(true);
    setSetKey(''); setSetValue('');
  };

  // CATEGORIES SUBMIT
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return;
    setLoading(true);
    try {
      const payload = {
        name: catName,
        slug: catSlug,
        tagline: catTagline,
        description: catDesc,
        image: catImage || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
        is_featured: catIsFeatured,
        display_order: parseInt(catOrder) || 0,
      };
      if (editingId) {
        await updateCategoryAdmin(editingId, payload);
        setMessage({ type: 'success', text: 'Category updated successfully!' });
      } else {
        await createCategoryAdmin(payload);
        setMessage({ type: 'success', text: 'Category created successfully!' });
      }
      resetForms();
      await loadAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Category action failed.' });
      setLoading(false);
    }
  };

  // PRODUCTS SUBMIT (All 19 Fields Handled)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodSlug || !prodCatId || !prodPrice) return;
    
    // Validation
    const regPrice = parseFloat(prodPrice);
    const salePrice = prodOrigPrice ? parseFloat(prodOrigPrice) : undefined;
    if (regPrice < 0) {
      setMessage({ type: 'error', text: 'Regular price cannot be negative.' });
      return;
    }
    if (salePrice !== undefined && salePrice < 0) {
      setMessage({ type: 'error', text: 'Sale price cannot be negative.' });
      return;
    }

    setLoading(true);
    try {
      const featArr = prodFeatures ? prodFeatures.split('\n').filter(Boolean) : [];
      const payload = {
        category_id: prodCatId,
        name: prodName,
        slug: prodSlug,
        sku: prodSku,
        sub_category: prodSubCat,
        price: regPrice,
        original_price: salePrice,
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
        await updateProductAdmin(editingId, payload);
        setMessage({ type: 'success', text: 'Product updated successfully!' });
      } else {
        await createProductAdmin(payload);
        setMessage({ type: 'success', text: 'Product created successfully!' });
      }
      resetForms();
      await loadAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Product action failed.' });
      setLoading(false);
    }
  };

  // SERVICES SUBMIT
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcName || !svcSlug || !svcDesc) return;
    setLoading(true);
    try {
      const featArr = svcFeatures ? svcFeatures.split('\n').filter(Boolean) : [];
      const appArr = svcApplications ? svcApplications.split('\n').filter(Boolean) : [];
      const payload = {
        name: svcName,
        slug: svcSlug,
        short_name: svcShortName || svcName,
        description: svcDesc,
        long_description: svcLongDesc || svcDesc,
        image: svcImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
        features: featArr,
        applications: appArr,
        display_order: parseInt(svcOrder) || 0,
        is_published: svcIsPublished,
      };

      if (editingId) {
        await updateServiceAdmin(editingId, payload);
        setMessage({ type: 'success', text: 'Service updated successfully!' });
      } else {
        await createServiceAdmin(payload);
        setMessage({ type: 'success', text: 'Service created successfully!' });
      }
      resetForms();
      await loadAllData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Service action failed.' });
      setLoading(false);
    }
  };

  // TESTIMONIALS SUBMIT
  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
            message.type === 'success'
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
          { id: 'faqs', label: 'FAQs', icon: HelpCircle, count: faqs.length },
          { id: 'settings', label: 'Site Settings', icon: Settings, count: settings.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              resetForms();
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === tab.id
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
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-gold-deep" />
              {editingId ? 'Edit Category' : 'Add Category'}
            </h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
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
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setCatImage)}
                    />
                  </label>
                </div>
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
              <Button type="submit" disabled={loading || uploading} className="w-full gold-button font-medium">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Update Category' : 'Save Category'}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForms} className="w-full">
                  Cancel Edit
                </Button>
              )}
            </form>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4">Categories ({categories.length})</h3>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No categories in database.</p>
            ) : (
              <div className="space-y-3">
                {categories.map((c) => (
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(c.id);
                          setCatName(c.name);
                          setCatSlug(c.slug);
                          setCatTagline(c.tagline || '');
                          setCatDesc(c.description || '');
                          setCatImage(c.image || '');
                          setCatIsFeatured(c.is_featured || false);
                          setCatOrder(c.display_order?.toString() || '0');
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
          </div>
        </div>
      )}

      {/* PRODUCTS TAB (Complete 19-Field Coverage) */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-gold-deep" />
              {editingId ? 'Edit Product' : 'Add Product'}
            </h3>
            <form onSubmit={handleProductSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Category *</Label>
                    <select
                      value={prodCatId}
                      onChange={(e) => setProdCatId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background/50 p-2.5 text-sm"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Sub-Category</Label>
                    <Input value={prodSubCat} onChange={(e) => setProdSubCat(e.target.value)} placeholder="Vessels / Planters" />
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Price (INR) *</Label>
                    <Input type="number" required value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} placeholder="4999" />
                  </div>
                  <div>
                    <Label>Sale Price (INR)</Label>
                    <Input type="number" value={prodOrigPrice} onChange={(e) => setProdOrigPrice(e.target.value)} placeholder="3999" />
                  </div>
                </div>
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
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setProdImage)} />
                    </label>
                  </div>
                  {prodImage && (
                    <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-xl border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={prodImage} alt="Preview" className="h-full w-full object-cover" />
                    </div>
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

              <Button type="submit" disabled={loading || uploading} className="w-full gold-button font-medium mt-4">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Update Product' : 'Save Product'}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForms} className="w-full">
                  Cancel Edit
                </Button>
              )}
            </form>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4">Products ({products.length})</h3>
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No products in database.</p>
            ) : (
              <div className="space-y-3">
                {products.map((p) => (
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
                          slug: {p.slug} • Price: ₹{p.price} {p.original_price ? `(Sale: ₹${p.original_price})` : ''} {p.sku ? `• SKU: ${p.sku}` : ''}
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
                          setEditingId(p.id);
                          setProdName(p.name);
                          setProdSlug(p.slug);
                          setProdSku(p.sku || '');
                          setProdCatId(p.category_id);
                          setProdSubCat(p.sub_category || '');
                          setProdPrice(p.price?.toString() || '');
                          setProdOrigPrice(p.original_price?.toString() || '');
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
          </div>
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-gold-deep" />
              {editingId ? 'Edit Service' : 'Add Service'}
            </h3>
            <form onSubmit={handleServiceSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
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
                <Label>Image URL / Upload</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={svcImage} onChange={(e) => setSvcImage(e.target.value)} placeholder="https://..." />
                  <label className="cursor-pointer flex items-center gap-1 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-medium hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setSvcImage)} />
                  </label>
                </div>
                {svcImage && (
                  <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-xl border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={svcImage} alt="Preview" className="h-full w-full object-cover" />
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
              <Button type="submit" disabled={loading || uploading} className="w-full gold-button font-medium">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Update Service' : 'Save Service'}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForms} className="w-full">
                  Cancel Edit
                </Button>
              )}
            </form>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4">Services ({services.length})</h3>
            <div className="space-y-3">
              {services.map((s) => (
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
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(s.id);
                        setSvcName(s.name);
                        setSvcSlug(s.slug);
                        setSvcShortName(s.short_name || '');
                        setSvcDesc(s.description || '');
                        setSvcLongDesc(s.long_description || '');
                        setSvcImage(s.image || '');
                        setSvcFeatures(s.features ? s.features.join('\n') : '');
                        setSvcApplications(s.applications ? s.applications.join('\n') : '');
                        setSvcOrder(s.display_order?.toString() || '0');
                        setSvcIsPublished(s.is_published);
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
          </div>
        </div>
      )}

      {/* TESTIMONIALS TAB */}
      {activeTab === 'testimonials' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-gold-deep" />
              {editingId ? 'Edit Testimonial' : 'Add Testimonial'}
            </h3>
            <form onSubmit={handleTestimonialSubmit} className="space-y-4">
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
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setTestAvatar)} />
                  </label>
                </div>
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
              <Button type="submit" disabled={loading || uploading} className="w-full gold-button font-medium">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Update Testimonial' : 'Save Testimonial'}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForms} className="w-full">
                  Cancel Edit
                </Button>
              )}
            </form>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4">Testimonials ({testimonials.length})</h3>
            <div className="space-y-3">
              {testimonials.map((t) => (
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
          </div>
        </div>
      )}

      {/* FAQS TAB */}
      {activeTab === 'faqs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-gold-deep" />
              {editingId ? 'Edit FAQ' : 'Add FAQ'}
            </h3>
            <form onSubmit={handleFaqSubmit} className="space-y-4">
              <div>
                <Label>Question *</Label>
                <Input required value={faqQ} onChange={(e) => setFaqQ(e.target.value)} placeholder="What is PU coating?" />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={faqCategory} onChange={(e) => setFaqCategory(e.target.value)} placeholder="General / Services / Pricing" />
              </div>
              <div>
                <Label>Answer *</Label>
                <Textarea required value={faqA} onChange={(e) => setFaqA(e.target.value)} placeholder="PU coating provides high durability." className="min-h-[100px]" />
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
              <Button type="submit" disabled={loading} className="w-full gold-button font-medium">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Update FAQ' : 'Save FAQ'}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForms} className="w-full">
                  Cancel Edit
                </Button>
              )}
            </form>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4">FAQs ({faqs.length})</h3>
            <div className="space-y-3">
              {faqs.map((f) => (
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
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-gold-deep" />
              Save Site Setting
            </h3>
            <form onSubmit={handleSettingSubmit} className="space-y-4">
              <div>
                <Label>Setting Key *</Label>
                <Input required value={setKey} onChange={(e) => setSetKey(e.target.value)} placeholder="brandName" />
              </div>
              <div>
                <Label>Setting Value (JSON or Text) *</Label>
                <Textarea required value={setValue} onChange={(e) => setSetValue(e.target.value)} placeholder='"RT PU COATING WORKS"' className="min-h-[100px]" />
              </div>
              <Button type="submit" disabled={loading} className="w-full gold-button font-medium">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Setting'}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4">Site Settings ({settings.length})</h3>
            <div className="space-y-3">
              {settings.map((s) => (
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
          </div>
        </div>
      )}

      {/* INQUIRIES / LEADS TAB */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <span className="mr-2 text-xs font-medium text-muted-foreground">Division:</span>
                <select
                  value={inquiryDivisionFilter}
                  onChange={(e) => setInquiryDivisionFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background/50 px-3 py-1.5 text-xs"
                >
                  <option value="all">All Divisions</option>
                  <option value="home_decor">Home Decor & Lifestyle</option>
                  <option value="metal_coating">Metal Coating Services</option>
                </select>
              </div>

              <div>
                <span className="mr-2 text-xs font-medium text-muted-foreground">Status:</span>
                <select
                  value={inquiryStatusFilter}
                  onChange={(e) => setInquiryStatusFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background/50 px-3 py-1.5 text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{inquiries.filter((inq) => {
                const matchDiv = inquiryDivisionFilter === 'all' || inq.division === inquiryDivisionFilter;
                const matchStat = inquiryStatusFilter === 'all' || inq.status === inquiryStatusFilter;
                return matchDiv && matchStat;
              }).length}</span> of {inquiries.length} leads
            </div>
          </div>

          {/* Inquiries List */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Inbox className="h-4 w-4 text-gold-deep" />
              Customer Inquiry Leads ({inquiries.length})
            </h3>

            {inquiries.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No customer inquiries in database yet.
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries
                  .filter((inq) => {
                    const matchDiv = inquiryDivisionFilter === 'all' || inq.division === inquiryDivisionFilter;
                    const matchStat = inquiryStatusFilter === 'all' || inq.status === inquiryStatusFilter;
                    return matchDiv && matchStat;
                  })
                  .map((inq) => (
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
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                inq.status === 'new'
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
          </div>
        </div>
      )}
    </div>
  );
}
