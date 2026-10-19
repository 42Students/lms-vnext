"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/class-names";

export type ListToolbarProps = {
  /** Accessible toolbar title when more than one list appears on a page. */
  label?: string;
  /** Page-owned search form/control; this component never submits on its own. */
  search?: ReactNode;
  /** Page-owned search submit button, usually associated with its GET form. */
  searchAction?: ReactNode;
  /** Supply the actual working controls (e.g. <Button variant="secondary">Filters</Button>). */
  filters?: ReactNode;
  views?: ReactNode;
  columns?: ReactNode;
  exportAction?: ReactNode;
  /** Working click handlers provide matching outlined buttons when custom slots are absent. */
  onFiltersClick?: () => void;
  onViewsClick?: () => void;
  onColumnsClick?: () => void;
  onExportClick?: () => void;
  filterCount?: number;
  /** Showing a count does not implicitly select or mutate records. */
  viewCount?: number;
  bulkAction?: ReactNode;
  className?: string;
};

/** Continuous-canvas list toolbar from old-lms-pages.md §§3–6.
 * Actions are slots so existing URL/state/permission rules stay with the owning page.
 */
export function ListToolbar({
  label = "List tools", search, searchAction, filters, views, columns, exportAction,
  onFiltersClick, onViewsClick, onColumnsClick, onExportClick, filterCount,
  viewCount, bulkAction, className,
}: ListToolbarProps) {
  const count = typeof viewCount === "number" && Number.isFinite(viewCount) ? Math.max(0, Math.trunc(viewCount)) : null;
  const activeFilters = typeof filterCount === "number" && Number.isFinite(filterCount) ?
    Math.max(0, Math.trunc(filterCount)) : 0;
  const filterControl = filters ?? (onFiltersClick ? <Button variant="secondary" size="sm" onClick={onFiltersClick}>Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}</Button> : null);
  const viewControl = views ?? (onViewsClick ? <Button variant="secondary" size="sm" onClick={onViewsClick}>Views</Button> : null);
  const columnControl = columns ?? (onColumnsClick ? <Button variant="secondary" size="sm" onClick={onColumnsClick}>Columns</Button> : null);
  const exportControl = exportAction ?? (onExportClick ? <Button variant="secondary" size="sm" onClick={onExportClick}>Export</Button> : null);
  return <section data-slot="list-toolbar" data-active-filters={activeFilters} aria-label={label} className={cx("min-w-0 space-y-[var(--lms-space-3)]", className)}>
    <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
      {search ? <div className="flex min-w-0 w-full flex-1 basis-[220px] items-center gap-[var(--lms-space-2)] sm:max-w-[380px]"><div className="min-w-0 flex-1">{search}</div>{searchAction}</div> : searchAction ?? null}
      {filterControl || viewControl || columnControl || exportControl ? <div role="toolbar" aria-label={`${label} actions`}
        className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
        {filterControl}{viewControl}{columnControl}{exportControl}
      </div> : null}
    </div>
    {count !== null || bulkAction ? <div className="flex min-w-0 flex-wrap items-center justify-between gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-2)] text-[12px] text-[var(--lms-neutral-500)]">
      {count !== null ? <span role="status" aria-live="polite" className="tabular-nums">{count} {count === 1 ? "item" : "items"} in this view</span> : <span />}
      {bulkAction}
    </div> : null}
  </section>;
}
