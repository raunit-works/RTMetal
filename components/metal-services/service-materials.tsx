import Image from 'next/image';
import { Layers } from 'lucide-react';
import { getServiceApplications } from '@/lib/metal-service-content';
import type { Service } from '@/lib/types';

interface ServiceMaterialsProps {
  service: Service;
}

export function ServiceMaterials({ service }: ServiceMaterialsProps) {
  const applications = getServiceApplications(service);
  if (applications.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-ultra text-gold-deep">
            Substrates &amp; Applications
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Materials &amp; Applications
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Component types and material areas typically discussed for{' '}
            {service.name}.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {applications.map((application) => (
            <article
              key={application.title}
              className="group overflow-hidden rounded-2xl border border-[#E7E2DA] bg-white transition-colors duration-300 hover:border-gold/50"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={application.image}
                  alt={application.alt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <span className="absolute left-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gold-deep shadow-sm">
                  <Layers className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <h3 className="text-base font-semibold text-foreground sm:text-lg">
                  {application.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {application.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
