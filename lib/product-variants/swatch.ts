import type { ProductOptionValue } from '@/lib/types';

export interface FinishSwatchVisual {
  imageUrl?: string;
  background?: string;
}

const FALLBACK_SWATCHES: Array<{ pattern: RegExp; background: string }> = [
  {
    pattern: /rose\s*gold/i,
    background: 'linear-gradient(135deg, #f3c4b7 0%, #c98a83 45%, #a85f6a 100%)',
  },
  {
    pattern: /champagne/i,
    background: 'linear-gradient(135deg, #fbf0cc 0%, #dec47a 55%, #b8943c 100%)',
  },
  {
    pattern: /gold|brass/i,
    background: 'linear-gradient(135deg, #f8e9ad 0%, #d6b64b 50%, #9a7a22 100%)',
  },
  {
    pattern: /silver|mirror|chrome|steel/i,
    background: 'linear-gradient(135deg, #ffffff 0%, #d5d7da 42%, #8d9095 100%)',
  },
  {
    pattern: /copper/i,
    background: 'linear-gradient(135deg, #edb08c 0%, #bb6c47 55%, #7c3b25 100%)',
  },
  {
    pattern: /bronze|antique/i,
    background: 'linear-gradient(135deg, #ad8055 0%, #74492b 55%, #452a19 100%)',
  },
  {
    pattern: /black|matte|graphite/i,
    background: 'linear-gradient(135deg, #4a4a4d 0%, #242426 55%, #141415 100%)',
  },
];

const COMPACT_FINISH_ALIASES: Record<string, string> = {
  'silver mirror': 'Silver',
  'silver mirror finish': 'Silver',
  'antique bronze': 'Bronze',
  'antique bronze finish': 'Bronze',
};

function cleanSwatchColor(value?: string): string | undefined {
  const color = value?.trim();
  if (!color || /url\s*\(/i.test(color)) return undefined;
  return color;
}

export function getCompactFinishLabel(name: string): string {
  const withoutSuffix = name.replace(/\s+finish\s*$/i, '').replace(/\s+/g, ' ').trim();
  if (!withoutSuffix) return name.trim();

  return (
    COMPACT_FINISH_ALIASES[withoutSuffix.toLowerCase()] ??
    COMPACT_FINISH_ALIASES[name.trim().toLowerCase()] ??
    withoutSuffix
  );
}

export function getFinishSwatchVisual(
  finishName: string,
  value?: ProductOptionValue
): FinishSwatchVisual {
  if (value?.swatchType === 'image' && value.swatchImageUrl) {
    return { imageUrl: value.swatchImageUrl };
  }

  const primary = cleanSwatchColor(value?.swatchColor);
  const secondary = cleanSwatchColor(value?.swatchColorSecondary);

  if (primary && secondary) {
    return { background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` };
  }

  if (primary) {
    return { background: primary };
  }

  const fallback = FALLBACK_SWATCHES.find(({ pattern }) => pattern.test(finishName));
  return {
    background:
      fallback?.background ??
      'linear-gradient(135deg, #eae2d4 0%, #c4b7a4 55%, #9f917d 100%)',
  };
}
