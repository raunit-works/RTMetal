import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { categoryHref } from '@/lib/category-hierarchy';
import type { Category } from '@/lib/types';

interface RelatedMetalCategoriesProps {
  serviceName: string;
  categories: Category[];
}

/**
 * Renders the admin-assigned Metal categories for one service. The list is
 * already filtered to published Metal categories by the data-access layer.
 * When nothing is assigned, the section is omitted rather than showing an
 * empty band or unrelated categories.
 */
export function RelatedMetalCategories({
  serviceName,
  categories,
}: RelatedMetalCategoriesProps) {
  if (categories.length === 0) return null;

  return (
    <section className="bg-ivory py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-ultra text-gold-deep">
            {serviceName} Catalogue
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Explore Related Metal Categories
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Browse metalwork categories associated with this finishing service.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id ?? category.slug}
              href={categoryHref(category)}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E7E2DA] bg-white transition-colors duration-300 hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {category.image && (
                  <Image
                    src={category.image}
                    alt={`${category.name} metalwork category`}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-medium leading-snug text-foreground sm:text-xl">
                    {category.name}
                  </h3>
                  <ArrowUpRight
                    className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </div>

                {(category.tagline || category.description) && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {category.tagline || category.description}
                  </p>
                )}

                <span className="mt-auto pt-5 text-xs font-semibold text-gold-deep underline-offset-4 group-hover:underline">
                  Explore Category
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
