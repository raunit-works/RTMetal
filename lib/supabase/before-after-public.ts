import { createSupabasePublicClient, createSupabaseServerClient } from './server';
import {
  BEFORE_AFTER_PROJECT_SELECT,
  isBeforeAfterSchemaMissingError,
  mapBeforeAfterProjectRow,
  type BeforeAfterProjectRow,
} from './before-after-shared';
import type { BeforeAfterProject, BeforeAfterServiceRef } from '../types';

export interface BeforeAfterFacets {
  services: BeforeAfterServiceRef[];
  materials: string[];
  total: number;
  verified: number;
  illustrative: number;
  available: boolean;
}

export interface BeforeAfterPageResult {
  projects: BeforeAfterProject[];
  total: number;
  available: boolean;
}

const EMPTY_FACETS: BeforeAfterFacets = {
  services: [],
  materials: [],
  total: 0,
  verified: 0,
  illustrative: 0,
  available: true,
};

export async function getPublishedBeforeAfterFacets(): Promise<BeforeAfterFacets> {
  try {
    const supabase = createSupabaseServerClient();
    const projectsResult = await supabase
      .from('before_after_projects')
      .select('id, comparison_type, material')
      .eq('status', 'published');

    if (projectsResult.error) {
      if (isBeforeAfterSchemaMissingError(projectsResult.error)) {
        return { ...EMPTY_FACETS, available: false };
      }
      throw projectsResult.error;
    }

    const projects = projectsResult.data ?? [];
    let linkRows: Array<{
      display_order: number | null;
      services:
        | { id: string; name: string; slug: string }
        | { id: string; name: string; slug: string }[]
        | null;
    }> = [];

    if (projects.length > 0) {
      const linksResult = await supabase
        .from('before_after_project_services')
        .select('project_id, display_order, services(id, name, slug)')
        .in(
          'project_id',
          projects.map((project) => project.id)
        );

      if (linksResult.error) {
        if (isBeforeAfterSchemaMissingError(linksResult.error)) {
          return { ...EMPTY_FACETS, available: false };
        }
        throw linksResult.error;
      }

      linkRows = linksResult.data ?? [];
    }

    const services = new Map<string, BeforeAfterServiceRef>();

    for (const link of linkRows) {
      const service = Array.isArray(link.services) ? link.services[0] : link.services;
      if (!service?.id || services.has(service.id)) continue;
      services.set(service.id, {
        id: service.id,
        name: service.name,
        slug: service.slug,
        displayOrder: Number(link.display_order ?? 0),
      });
    }

    const materials = Array.from(
      new Set(
        projects
          .map((project) => project.material?.trim())
          .filter((material): material is string => Boolean(material))
      )
    ).sort((a, b) => a.localeCompare(b));

    return {
      services: Array.from(services.values()).sort((a, b) => {
        if ((a.displayOrder ?? 0) !== (b.displayOrder ?? 0)) {
          return Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0);
        }
        return a.name.localeCompare(b.name);
      }),
      materials,
      total: projects.length,
      verified: projects.filter((project) => project.comparison_type === 'verified').length,
      illustrative: projects.filter((project) => project.comparison_type === 'illustrative').length,
      available: true,
    };
  } catch (error) {
    console.error('[Before & After] Could not load public facets:', error);
    return { ...EMPTY_FACETS, available: false };
  }
}

async function resolvePublishedServiceId(serviceSlug: string): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('services')
    .select('id')
    .eq('slug', serviceSlug)
    .eq('is_published', true)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function getPublishedBeforeAfterProjects(options: {
  serviceSlug?: string;
  offset?: number;
  limit?: number;
} = {}): Promise<BeforeAfterPageResult> {
  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.min(48, Math.max(1, options.limit ?? 8));

  try {
    const supabase = createSupabaseServerClient();
    let projectIdsForService: string[] | null = null;

    if (options.serviceSlug) {
      const serviceId = await resolvePublishedServiceId(options.serviceSlug);
      if (!serviceId) return { projects: [], total: 0, available: true };

      const { data: links, error: linkError } = await supabase
        .from('before_after_project_services')
        .select('project_id')
        .eq('service_id', serviceId);

      if (linkError) {
        if (isBeforeAfterSchemaMissingError(linkError)) {
          return { projects: [], total: 0, available: false };
        }
        throw linkError;
      }

      projectIdsForService = Array.from(
        new Set((links ?? []).map((link) => link.project_id).filter(Boolean))
      );
      if (projectIdsForService.length === 0) {
        return { projects: [], total: 0, available: true };
      }
    }

    let query = supabase
      .from('before_after_projects')
      .select(BEFORE_AFTER_PROJECT_SELECT, { count: 'exact' })
      .eq('status', 'published');

    if (projectIdsForService) {
      query = query.in('id', projectIdsForService);
    }

    const { data, error, count } = await query
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('project_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      if (isBeforeAfterSchemaMissingError(error)) {
        return { projects: [], total: 0, available: false };
      }
      throw error;
    }

    return {
      projects: ((data ?? []) as unknown as BeforeAfterProjectRow[]).map(
        mapBeforeAfterProjectRow
      ),
      total: count ?? 0,
      available: true,
    };
  } catch (error) {
    console.error('[Before & After] Could not load public projects:', error);
    return { projects: [], total: 0, available: false };
  }
}

export async function getPublishedBeforeAfterSitemapEntries(): Promise<
  Array<{ slug: string; updatedAt: string | null }>
> {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from('before_after_projects')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (error) {
      if (isBeforeAfterSchemaMissingError(error)) return [];
      throw error;
    }

    return (data ?? [])
      .filter((row) => Boolean(row.slug))
      .map((row) => ({
        slug: row.slug as string,
        updatedAt: (row.updated_at as string | null) ?? null,
      }));
  } catch (error) {
    console.error('[Before & After] Could not load sitemap entries:', error);
    return [];
  }
}

export async function getPublishedBeforeAfterProjectBySlug(
  slug: string
): Promise<BeforeAfterProject | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('before_after_projects')
      .select(BEFORE_AFTER_PROJECT_SELECT)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) {
      if (isBeforeAfterSchemaMissingError(error)) return null;
      throw error;
    }

    return data ? mapBeforeAfterProjectRow(data as unknown as BeforeAfterProjectRow) : null;
  } catch (error) {
    console.error('[Before & After] Could not load public project:', error);
    return null;
  }
}
