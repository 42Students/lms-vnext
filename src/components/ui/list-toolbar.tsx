import type { ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type ListToolbarProps = {
  /** Page-owned search form/control; this component never submits on its own. */
  search?: ReactNode;
  /** Supply the actual working controls (e.g. <Button variant="secondary">Filters</Button>). */
  filters?: ReactNode;
  views?: ReactNode;
  columns?: ReactNode;
  exportAction?: ReactNode;
  /** Showing a count does not implicitly select or mutate records. */
  viewCount?: number;
  bulkAction?: ReactNode;
  className?: string;
};

/** Continuous-canvas list toolbar from old-lms-pages.md §§3–6.
 * Actions are slots so existing URL/state/permission rules stay with the owning page.
 */
export function ListToolbar({ search, filters, views, columns, exportAction, viewCount, bulkAction, className }: ListToolbarProps) {
  const count = typeof viewCount === "number" && Number.isFinite(viewCount) ? Math.max(0, Math.trunc(viewCount)) : null;
  return <section data-slot="list-toolbar" aria-label="List tools" className={cx("min-w-0 space-y-[var(--lms-space-3)]", className)}>
    <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
      {search ? <div className="min-w-0 w-full flex-1 basis-[220px] sm:max-w-[380px]">{search}</div> : null}
      {filters || views || columns || exportAction ? <div role="toolbar" aria-label="Filters and table actions"
        className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)] [&_[data-slot=button]]:border-[var(--lms-canvas-border)] [&_[data-slot=button]]:bg-white [&_[data-slot=button]]:text-[var(--lms-body-text)]">
        {filters}{views}{columns}{exportAction}
      </div> : null}
    </div>
    {count !== null || bulkAction ? <div className="flex min-w-0 flex-wrap items-center justify-between gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-2)] text-[12px] text-[var(--lms-neutral-500)]">
      {count !== null ? <span className="tabular-nums">{count} {count === 1 ? "item" : "items"} in this view</span> : <span />}
      {bulkAction}
    </div> : null}
  </section>;
}
