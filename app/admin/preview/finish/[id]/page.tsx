import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { verifyAdminAccess } from '@/lib/supabase/admin';
import { getMetalFinishPreviewById } from '@/lib/supabase/metal-finishes-preview';
import { FinishPreviewCard } from '@/components/admin/finishes/finish-preview-card';
import type { MetalFinishStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Metal Finish Preview',
  robots: {
    index: false,
    follow: false,
  },
};

function statusLabel(status: MetalFinishStatus) {
  if (status === 'published') return 'Published';
  if (status === 'archived') return 'Archived';
  return 'Draft';
}

function statusClass(status: MetalFinishStatus) {
  if (status === 'published') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700';
  }
  if (status === 'archived') {
    return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-600';
  }
  return 'border-amber-500/30 bg-amber-500/10 text-amber-700';
}

export default async function MetalFinishPreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const { isAdmin } = await verifyAdminAccess();

  if (!isAdmin) {
    redirect(
      `/login?redirectTo=${encodeURIComponent(
        `/admin/preview/finish/${params.id}`
      )}`
    );
  }

  const finish = await getMetalFinishPreviewById(params.id);

  if (!finish) {
    notFound();
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to admin
        </Link>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Administrator-only preview
        </span>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-deep">
              Metal Finish Preview
            </p>
            <h1 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">
              {finish.name}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {finish.finishCode} · Display order {finish.displayOrder}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusClass(
                finish.status
              )}`}
            >
              {statusLabel(finish.status)}
            </span>

            {finish.status === 'published' && (
              <Link
                href="/metal-coating#finishes"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View live section
              </Link>
            )}
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {finish.status === 'published'
            ? 'This finish is publicly visible. The preview below shows its public card design and detail images.'
            : 'This finish is not publicly visible. The preview below is served only inside the protected admin route.'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Public card
          </h2>
          <FinishPreviewCard finish={finish} />
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card/60 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Additional related images
            </h2>

            {finish.additionalImages.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                No additional images. Add detail shots in the editor to make
                them available in the public enlarged view.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {finish.additionalImages.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <Image
                      src={url}
                      alt={`${finish.name} detail ${index + 1}`}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card/60 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stored details
            </h2>
            <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <dt className="font-medium text-muted-foreground">
                  Appearance
                </dt>
                <dd className="mt-0.5 text-foreground">{finish.appearance}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">
                  Applications
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {finish.applications}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium text-muted-foreground">
                  Short description
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {finish.shortDescription || 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">
                  Last updated
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {new Date(finish.updatedAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Status</dt>
                <dd className="mt-0.5 text-foreground">
                  {statusLabel(finish.status)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
