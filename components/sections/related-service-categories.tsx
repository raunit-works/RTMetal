import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { categoryHref } from '@/lib/category-hierarchy';
import type { Category } from '@/lib/types';

interface RelatedServiceCategoriesProps {
  serviceName: string;
  categories: Category[];
}

/**
 * Public "Related Metal Categories" section.
 *
 * Rendered only when the service has at least one publishable Metal category,
 * so services with no assignments never show an empty block.
 */
export function RelatedServiceCategories({
  serviceName,
  categories,
}: RelatedServiceCategoriesProps) {
  if (categories.length === 0) return null;

  return (
    <section className="border-t border-border/60 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="mb-10 max-w-2xl sm:mb-12">
          <p className="mb-3 text-xs font-medium uppercase tracking-ultra text-gold-deep">
            {serviceName} Catalogue
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Related Metal Categories
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Explore metalwork categories associated with this service. Browse
            available products and enquire about your project requirements.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id ?? category.slug}
              href={categoryHref(category)}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-colors duration-300 hover:border-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {category.image && (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-medium leading-snug text-foreground sm:text-xl">
                    {category.name}
                  </h3>
                  <ArrowUpRight
                    className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>

                {(category.tagline || category.description) && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {category.tagline || category.description}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span className="text-xs font-medium text-gold-deep">
                    {category.productCount} piece{category.productCount === 1 ? '' : 's'}
                  </span>
                  <span className="text-xs font-semibold text-foreground underline-offset-4 group-hover:text-gold-deep group-hover:underline">
                    Explore Category
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
