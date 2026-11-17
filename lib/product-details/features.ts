/**
 * Normalises the persisted product feature collection for display.
 *
 * Older Admin saves stored every feature as newline-separated text inside a
 * single array element. Splitting only on explicit line breaks repairs those
 * records without changing their wording or touching the database. Commas and
 * spaces are never used as separators, so ordinary sentences remain intact.
 */
export function normalizeProductFeatures(
  value: string[] | string | null | undefined
): string[] {
  if (value == null) return [];

  const entries = Array.isArray(value) ? value : [value];

  return entries
    .flatMap((entry) => String(entry ?? '').split(/\r?\n/))
    .map((feature) => feature.trim())
    .filter((feature) => feature.length > 0);
}
