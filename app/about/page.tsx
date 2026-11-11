import type { Metadata } from 'next';

import { AboutHero } from '@/components/about/AboutHero';
import { AboutStory } from '@/components/about/AboutStory';
import { AboutVisionMission } from '@/components/about/AboutVisionMission';
import { AboutFinishingProcess } from '@/components/about/AboutFinishingProcess';
import { AboutBusinessDivisions } from '@/components/about/AboutBusinessDivisions';
import { AboutWhyChoose } from '@/components/about/AboutWhyChoose';
import { AboutCTA } from '@/components/about/AboutCTA';
import { getSiteUrlForPath } from '@/lib/site-url';

const canonicalUrl = getSiteUrlForPath('/about');

const pageTitle = 'About RTMETALCOATING | Metal Finishing & RT HOME DECOR';
const pageDescription =
  'Learn about RTMETALCOATING, our metal coating and decorative finishing services in Mumbai, and our RT HOME DECOR retail division based in Wai, Satara.';

export const metadata: Metadata = {
  title: {
    absolute: pageTitle,
  },
  description: pageDescription,
  alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
  },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutStory />
      <AboutVisionMission />
      <AboutFinishingProcess />
      <AboutBusinessDivisions />
      <AboutWhyChoose />
      <AboutCTA />
    </>
  );
}
