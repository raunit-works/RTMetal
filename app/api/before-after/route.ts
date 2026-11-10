import { NextResponse } from 'next/server';
import { getPublishedBeforeAfterProjects } from '@/lib/supabase/before-after-public';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawOffset = Number.parseInt(searchParams.get('offset') ?? '0', 10);
    const rawLimit = Number.parseInt(searchParams.get('limit') ?? '8', 10);
    const service = searchParams.get('service')?.trim() || undefined;

    const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(48, Math.max(1, rawLimit))
      : 8;

    const result = await getPublishedBeforeAfterProjects({
      serviceSlug: service,
      offset,
      limit,
    });

    return NextResponse.json(
      {
        projects: result.projects,
        total: result.total,
        available: result.available,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('[API Error] Before & After gallery request failed:', error);
    return NextResponse.json(
      {
        projects: [],
        total: 0,
        available: false,
        message: 'Transformations could not be loaded.',
      },
      { status: 500 }
    );
  }
}
