export function normalizeAdminSearch(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function matchesAdminSearch(
  query: string,
  values: Array<string | number | boolean | null | undefined>
): boolean {
  const normalizedQuery = normalizeAdminSearch(query);
  if (!normalizedQuery) return true;
  return values.some((value) => normalizeAdminSearch(value).includes(normalizedQuery));
}

export function getAdminPageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, pageSize)));
}

export function getAdminPageSlice<T>(
  items: T[],
  page: number,
  pageSize: number
): T[] {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function clampAdminPage(page: number, total: number, pageSize: number): number {
  return Math.min(Math.max(1, page), getAdminPageCount(total, pageSize));
}

export function formatAdminDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
