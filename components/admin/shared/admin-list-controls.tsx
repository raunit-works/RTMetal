'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminFilterOption {
  value: string;
  label: string;
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = 'Search records…',
  ariaLabel = 'Search records',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative min-w-[210px] flex-1', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-9 w-full rounded-xl border border-border bg-background/60 pl-9 pr-9 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold/60 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function AdminFilterSelect({
  label,
  value,
  onChange,
  options,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: AdminFilterOption[];
  ariaLabel?: string;
}) {
  return (
    <label className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        aria-label={ariaLabel || label}
        className="h-9 max-w-[210px] rounded-xl border border-border bg-background/60 px-2.5 text-xs text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold/60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdminListToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  resultCount,
  totalCount,
  onClear,
  clearDisabled,
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  resultCount: number;
  totalCount: number;
  onClear?: () => void;
  clearDisabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 space-y-3 rounded-xl border border-border/70 bg-background/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <AdminSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        {children}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            disabled={clearDisabled}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground" aria-live="polite">
        Showing <span className="font-semibold text-foreground">{resultCount}</span> of{' '}
        <span className="font-semibold text-foreground">{totalCount}</span> records
      </p>
    </div>
  );
}

export function AdminPagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const safePage = Math.min(Math.max(1, page), pageCount);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
      <p className="text-[11px] text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Previous page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="min-w-[88px] text-center text-[11px] font-medium text-muted-foreground">
          Page {safePage} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= pageCount}
          aria-label="Next page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
