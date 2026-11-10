import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { verifyAdminAccess } from '@/lib/supabase/admin';
import { METAL_FINISHES_PUBLIC_CACHE_TAG } from '@/lib/supabase/metal-finishes-shared';

export const dynamic = 'force-dynamic';

export async function POST() {
  const { isAdmin, userId } = await verifyAdminAccess();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  revalidateTag(METAL_FINISHES_PUBLIC_CACHE_TAG);
  revalidatePath('/metal-coating');

  return NextResponse.json({ revalidated: true });
}
